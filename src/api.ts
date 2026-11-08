/** Rust との境界。コマンドを呼び、状態の更新を受け取る。 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import type { RestrictionsForm, SettingsView, SoundPurpose, View } from "./types";

export const getView = () => invoke<View>("get_view");

/** `seconds` が `null` なら、Rust が設定の既定時間を使う。 */
export const startTimer = (kind: "play" | "break", seconds: number | null) =>
  invoke<View>("start_timer", { kind, seconds });

export const getSettings = () => invoke<SettingsView>("get_settings");
export const saveSettings = (settings: SettingsView) =>
  invoke<void>("save_settings", { ...settings });

export interface UpdateInfo {
  version: string;
  notes: string | null;
}
export const checkUpdate = () => invoke<UpdateInfo | null>("check_update");
/** 入れ終わると再起動する。 */
export const installUpdate = () => invoke<void>("install_update");

export const speakNow = (volume: number) => invoke<void>("speak_now", { volume });
export const listOutputs = () => invoke<string[]>("list_outputs");
export const testSound = (purpose: SoundPurpose, device: string) =>
  invoke<void>("test_sound", { purpose, device });

export const getRestrictions = () => invoke<RestrictionsForm>("get_restrictions");
export const saveRestrictions = (form: RestrictionsForm) =>
  invoke<void>("save_restrictions", { form });

export const pauseTimer = () => invoke<View>("pause_timer");
export const resumeTimer = () => invoke<View>("resume_timer");
export const pressStopped = () => invoke<View>("press_stopped");

/** 保存内容をダウンロードフォルダーに書き出し、ファイルの場所を返す。 */
export const exportBackup = () => invoke<string>("export_backup");

export const openMini = () => invoke<void>("open_mini");
export const closeMini = () => invoke<void>("close_mini");
export const setFocusMode = (on: boolean) => invoke<void>("set_focus_mode", { on });

export const toastReady = () => invoke<void>("toast_ready");

export interface ToastLayout {
  width: number;
  height: number;
  count: number;
  padTop: number;
  padRight: number;
  padBottom: number;
  padLeft: number;
  cardLeft: number;
  cardTop: number;
  cardRight: number;
  cardBottom: number;
  cards: { id: number; left: number; top: number; right: number; bottom: number }[];
}
export const toastLayout = (layout: ToastLayout) => invoke<void>("toast_layout", { layout });

/** Rust が毎秒流す状態を購読する。最初の値が来るまでは `null`。 */
export function useView(): View | null {
  const [view, setView] = useState<View | null>(null);
  useEffect(() => {
    let alive = true;
    const unlisten = listen<View>("view", (event) => {
      if (alive) setView(event.payload);
    });
    getView().then((initial) => {
      if (alive) setView((current) => current ?? initial);
    });
    return () => {
      alive = false;
      unlisten.then((fn) => fn());
    };
  }, []);
  return view;
}
