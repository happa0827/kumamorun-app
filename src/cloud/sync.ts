/**
 * クラウドとの同期。メインウィンドウだけが動かす（ミニとトーストは動かさない）。
 * 状態の持ち主は Rust で、ここはそれを Firebase へ写し、Firebase の値を表示用に預かる。
 */

import { listen } from "@tauri-apps/api/event";
import { useSyncExternalStore } from "react";
import {
  applyCloudRestrictions,
  commitEvolution,
  getRestrictions,
  importCloud,
  planEvolution,
  restoreEvolution,
  saveRestrictions,
  takeEvolution,
} from "../api";
import type { RestrictionsForm, View } from "../types";
import { applyPendingEvolutions } from "./evolution";
import {
  addFlowers,
  casStage,
  isDevBuild,
  logOut,
  readDays,
  readStage,
  writeDays,
  onAccount,
  recordLogin,
  registerOfflineOnDisconnect,
  saveRestrictionsToCloud,
  signInDevAccount,
  watchConnection,
  watchNumber,
  watchRestrictions,
  writeLiveStatus,
  writeOffline,
  type Account,
} from "./cloud";
import { LiveStatusThrottle } from "./liveStatus";

export interface CloudState {
  /** 認証の復元が済むまでは `undefined`。 */
  account: Account | null | undefined;
  /** ログインしていない間や、まだ届いていない間は `null`。 */
  evolution: number | null;
  flowers: number | null;
  connected: boolean;
}

let state: CloudState = { account: undefined, evolution: null, flowers: null, connected: false };
const listeners = new Set<() => void>();

function update(patch: Partial<CloudState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

export function useCloud(): CloudState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
  );
}

const sameForm = (a: RestrictionsForm, b: RestrictionsForm) =>
  JSON.stringify(a) === JSON.stringify(b);

/** 設定画面から。ログイン中ならクラウドにも保存して、端末間で共有する。 */
export async function saveRestrictionsEverywhere(form: RestrictionsForm): Promise<void> {
  await saveRestrictions(form);
  const account = state.account;
  if (!account) return;
  try {
    await saveRestrictionsToCloud(account.uid, form);
  } catch (e) {
    console.warn("スタート制限のクラウド保存に失敗しました", e);
  }
}

/** ログアウト。先に「アプリは動いていない」を書いてから切る。 */
export async function logOutEverywhere(): Promise<void> {
  const account = state.account;
  if (account) await writeOffline(account.uid).catch(() => {});
  await logOut();
}

let started = false;

/** 一度だけ呼ぶ。 */
export function startCloudSync(): void {
  if (started) return;
  started = true;

  let latest: View | null = null;
  let uid: string | null = null;
  let teardown: Array<() => void> = [];
  const throttle = new LiveStatusThrottle();
  let disconnects = 0;
  let reconnects = 0;

  const push = () => {
    if (!uid || !state.connected || !latest) return;
    if (!throttle.shouldWrite(latest, Date.now())) return;
    writeLiveStatus(uid, latest).catch((e) => console.warn("liveStatus の保存に失敗しました", e));
  };

  // この端末に無い記録をクラウドから取り込み終えたか。終えるまで、こちらの記録は書かない
  // （空の記録でクラウドの前日分を上書きしないため）。
  let synced = false;
  let importing = false;
  let applying = false;
  let lastDays = "";

  const pushDays = () => {
    if (!uid || !state.connected || !synced || !latest?.daily) return;
    const history = Object.fromEntries(
      (latest.week ?? [])
        .filter((d) => d.plays > 0 || d.failures > 0)
        .map((d) => [d.date, { plays: d.plays, failures: d.failures }]),
    );
    const key = JSON.stringify([latest.daily, history]);
    if (key === lastDays) return;
    lastDays = key;
    writeDays(uid, latest.daily, history).catch((e) => {
      lastDays = "";
      console.warn("記録のクラウド保存に失敗しました", e);
    });
  };

  const applyEvolutions = async () => {
    const mine = uid;
    if (!mine || !state.connected || !synced || applying || !latest?.pendingEvolutions) return;
    applying = true;
    try {
      await applyPendingEvolutions({
        take: takeEvolution,
        restore: restoreEvolution,
        readStage: () => readStage(mine),
        plan: planEvolution,
        casStage: (expected, next) => casStage(mine, expected, next),
        addFlowers: (count) => addFlowers(mine, count),
        commit: commitEvolution,
      });
    } finally {
      applying = false;
    }
  };

  const syncDays = async () => {
    const mine = uid;
    if (!mine || !state.connected || synced || importing) return;
    importing = true;
    try {
      const { stats, history } = await readDays(mine);
      if (uid !== mine) return;
      // 取り込み後の状態を受け取ってから書く。古い状態でクラウドを上書きしない。
      latest = await importCloud(stats, history);
      synced = true;
    } catch (e) {
      console.warn("クラウドの記録を取り込めませんでした", e);
      return;
    } finally {
      importing = false;
    }
    pushDays();
    void applyEvolutions();
  };

  listen<View>("view", (event) => {
    latest = event.payload;
    push();
    pushDays();
    void applyEvolutions();
  });

  watchConnection((connected) => {
    if (state.connected && !connected) {
      disconnects += 1;
      console.info(`クラウドから切断されました（${disconnects}回目）`);
    }
    if (!state.connected && connected && disconnects > 0) {
      reconnects += 1;
      console.info(`クラウドに再接続しました（${reconnects}回目）`);
    }
    update({ connected });
    if (!connected || !uid) return;
    void syncDays();
    // つながるたびに、切断時の書き込みを登録し直し、Rust の最新の状態で書き直す。
    registerOfflineOnDisconnect(uid).catch((e) =>
      console.warn("onDisconnect の登録に失敗しました", e),
    );
    throttle.reset();
    push();
  });

  onAccount((account) => {
    teardown.forEach((fn) => fn());
    teardown = [];
    uid = account?.uid ?? null;
    throttle.reset();
    synced = false;
    lastDays = "";
    update({ account, evolution: null, flowers: null });
    if (!account) return;

    recordLogin(account.uid).catch(() => {});
    teardown.push(
      watchNumber(account.uid, "evolution", (evolution) => update({ evolution })),
      watchNumber(account.uid, "flowers", (flowers) => update({ flowers })),
      // 別の端末で変えたスタート制限を取り込む。自分の保存が戻ってきただけなら何もしない。
      watchRestrictions(account.uid, async (cloud) => {
        const local = await getRestrictions();
        if (!sameForm(local, cloud)) await applyCloudRestrictions(cloud);
      }),
    );
    if (state.connected) {
      registerOfflineOnDisconnect(account.uid).catch(() => {});
      push();
      void syncDays();
    }
  });

  if (isDevBuild) {
    signInDevAccount().catch((e) => console.warn("開発用アカウントにログインできませんでした", e));
  }
}
