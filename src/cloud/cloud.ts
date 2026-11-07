/**
 * Firebase との境界。画面とドメインは Firebase を知らず、ここだけが知る。
 * Firebase を別のものに替えるときは、このファイルの中身を差し替える。
 *
 * 保存の形（users/{uid}/…）は status-kumamorun が読むので変えない。
 */

import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  type Unsubscribe,
} from "firebase/database";
import type { RestrictionsForm } from "../types";
import { firebaseConfig } from "./config";
import { toLiveStatus } from "./liveStatus";
import type { View } from "../types";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/** 開発用アカウント。開発ビルドだけが .env から読み、本番ビルドには含まれない。 */
export const DEV_ACCOUNT = import.meta.env.DEV
  ? {
      email: import.meta.env.VITE_DEV_EMAIL as string | undefined,
      password: import.meta.env.VITE_DEV_PASSWORD as string | undefined,
    }
  : null;

export const isDevBuild = import.meta.env.DEV;

export interface Account {
  uid: string;
  email: string | null;
}

const toAccount = (user: User | null): Account | null =>
  user ? { uid: user.uid, email: user.email } : null;

export function onAccount(callback: (account: Account | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, (user) => callback(toAccount(user)));
}

export const logIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password).then(() => undefined);
export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password).then(() => undefined);
export const logOut = () => signOut(auth);

/** 開発ビルドは、本番のデータに触れないよう、開発用アカウントで自動ログインする。 */
export async function signInDevAccount(): Promise<void> {
  const email = DEV_ACCOUNT?.email;
  const password = DEV_ACCOUNT?.password;
  if (!email || !password) {
    console.warn(".env に VITE_DEV_EMAIL と VITE_DEV_PASSWORD を設定してください");
    return;
  }
  const current = auth.currentUser;
  if (current?.email === email) return;
  if (current) await signOut(auth);
  await signInWithEmailAndPassword(auth, email, password);
}

const path = (uid: string, key: string) => `users/${uid}/${key}`;

/** 数値の項目（進化・花）を購読する。無ければ 0。 */
export function watchNumber(uid: string, key: "evolution" | "flowers", callback: (n: number) => void) {
  return onValue(ref(db, path(uid, key)), (snap) => callback(Number(snap.val() ?? 0)));
}

export function watchRestrictions(
  uid: string,
  callback: (form: RestrictionsForm) => void,
): Unsubscribe {
  return onValue(ref(db, path(uid, "restrictions")), (snap) => {
    const value = snap.val();
    if (value) callback(value as RestrictionsForm);
  });
}

export const saveRestrictionsToCloud = (uid: string, form: RestrictionsForm) =>
  set(ref(db, path(uid, "restrictions")), form);

/** 当日の統計と直近の履歴。形の検証は Rust が行うので、生の値のまま返す。 */
export async function readDays(uid: string) {
  const [stats, history] = await Promise.all([
    get(ref(db, path(uid, "dailyStats"))),
    get(ref(db, path(uid, "dailyHistory"))),
  ]);
  return { stats: stats.val() as unknown, history: history.val() as unknown };
}

export function writeDays(uid: string, stats: unknown, history: unknown) {
  return Promise.all([
    set(ref(db, path(uid, "dailyStats")), stats),
    set(ref(db, path(uid, "dailyHistory")), history),
  ]);
}

export async function readStage(uid: string): Promise<number> {
  return Number((await get(ref(db, path(uid, "evolution")))).val() ?? 0);
}

/** 進化段階が `expected` のままのときだけ `next` を書く。書けたら true。 */
export async function casStage(uid: string, expected: number, next: number): Promise<boolean> {
  const result = await runTransaction(ref(db, path(uid, "evolution")), (current) =>
    Number(current ?? 0) === expected ? next : undefined,
  );
  return result.committed;
}

export async function addFlowers(uid: string, count: number): Promise<void> {
  await runTransaction(ref(db, path(uid, "flowers")), (current) => Number(current ?? 0) + count);
}

export const recordLogin = (uid: string) => set(ref(db, path(uid, "lastLogin")), Date.now());

/** 接続の状態。切れるたび、つながるたびに呼ばれる。 */
export function watchConnection(callback: (connected: boolean) => void): Unsubscribe {
  return onValue(ref(db, ".info/connected"), (snap) => callback(snap.val() === true));
}

export function writeLiveStatus(uid: string, view: View) {
  return set(ref(db, path(uid, "liveStatus")), toLiveStatus(view, Date.now()));
}

const offline = {
  appRunning: false,
  keeping: false,
  phase: "offline",
  label: "",
  remainingSec: null,
  startedAt: null,
  duration: null,
  running: false,
  startBlocked: false,
  blockReason: null,
  daily: null,
  week: null,
};

/** 切断されたら、サーバー側で「アプリは動いていない」にしてもらう。つながるたびに登録し直す。 */
export function registerOfflineOnDisconnect(uid: string) {
  // 時刻は登録時ではなく、切断を検知したサーバーが入れる。
  return onDisconnect(ref(db, path(uid, "liveStatus"))).set({
    ...offline,
    updatedAt: serverTimestamp(),
  });
}

/** ログアウトなど、自分から止めるとき。 */
export async function writeOffline(uid: string) {
  const target = ref(db, path(uid, "liveStatus"));
  await onDisconnect(target).cancel();
  await set(target, { ...offline, updatedAt: Date.now() });
}
