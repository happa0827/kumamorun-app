/**
 * クラウドの状態。同期は Rust が行う（ログイン、トークンの保管、送信、進化の反映）。
 * ここは Rust が流す状態を受け取って見せるだけで、Rust のコマンドを呼ぶ薄い窓口。
 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

/** Rust の `CloudView`（cloud/worker.rs）と同じ形。 */
export interface CloudState {
  /** 接続先が決まっているか。リリースビルドで未設定なら false。 */
  configured: boolean;
  loggedIn: boolean;
  /** 直近の通信が成功したか。 */
  connected: boolean;
  /** 進化段階。ログインしていない間や、まだ届いていない間は `null`。 */
  stage: number | null;
  flowers: number | null;
  deviceName: string | null;
  /** サイトの設定画面で決めた名前。まだ届いていなければ `null`。 */
  name: string | null;
  /** サイトの設定画面で決めた写真（`data:` か `https:` の URL）。無ければ `null`。 */
  image: string | null;
  /** 直近の失敗。成功すると消える。 */
  error: string | null;
  /**
   * アプリの版。サイトで承認されたアカウントだけが完全版。ログインしていなければデモ版。
   * Rust から最初の状態が届くまでは `null`（デモ版の案内を一瞬出さないため）。
   */
  edition: Edition | null;
  /** 端末にそろっている完全版の画像の版。そろっていなければ `null`（シルエットを出す）。 */
  charactersVersion: string | null;
}

export type Edition = "demo" | "full";

const INITIAL: CloudState = {
  configured: true,
  loggedIn: false,
  connected: false,
  stage: null,
  flowers: null,
  deviceName: null,
  name: null,
  image: null,
  error: null,
  edition: null,
  charactersVersion: null,
};

/** ブラウザーでログインのページを開く。サイトの「アプリを開く」で、アプリに戻ってくる。 */
export const openLogin = () => invoke<void>("open_login");

/** ブラウザーでサイト（状況ページ）を開く。 */
export const openSite = () => invoke<void>("open_site");

/** ログアウト。先にサイトを「停止」にして、サーバー側のトークンを失効する。 */
export const logOut = () => invoke<void>("log_out_cloud");

/** サーバーの内容を今すぐ取り直す。サイトで変えた名前と写真が、すぐに出る。 */
export const refreshCloud = () => invoke<void>("refresh_cloud");

export function useCloud(): CloudState {
  const [state, setState] = useState<CloudState>(INITIAL);
  useEffect(() => {
    let alive = true;
    // 最初の問い合わせの返事は、後から届いたイベントより古いことがある。イベントが先に来たら使わない。
    let received = false;
    const unlisten = listen<CloudState>("cloud", (event) => {
      if (!alive) return;
      received = true;
      setState(event.payload);
    });
    void invoke<CloudState>("get_cloud").then((initial) => {
      if (alive && !received) setState(initial);
    });
    return () => {
      alive = false;
      void unlisten.then((fn) => fn());
    };
  }, []);
  return state;
}
