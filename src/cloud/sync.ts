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
  /** 直近の失敗。成功すると消える。 */
  error: string | null;
}

const INITIAL: CloudState = {
  configured: true,
  loggedIn: false,
  connected: false,
  stage: null,
  flowers: null,
  deviceName: null,
  error: null,
};

/** ブラウザーでログインのページを開く。サイトの「アプリを開く」で、アプリに戻ってくる。 */
export const openLogin = () => invoke<void>("open_login");

/** ブラウザーでサイト（状況ページ）を開く。 */
export const openSite = () => invoke<void>("open_site");

/** ログアウト。先にサイトを「停止」にして、サーバー側のトークンを失効する。 */
export const logOut = () => invoke<void>("log_out_cloud");

export function useCloud(): CloudState {
  const [state, setState] = useState<CloudState>(INITIAL);
  useEffect(() => {
    let alive = true;
    const unlisten = listen<CloudState>("cloud", (event) => {
      if (alive) setState(event.payload);
    });
    invoke<CloudState>("get_cloud").then((initial) => {
      if (alive) setState(initial);
    });
    return () => {
      alive = false;
      unlisten.then((fn) => fn());
    };
  }, []);
  return state;
}
