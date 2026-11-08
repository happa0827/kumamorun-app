/** Rust の `View`（domain/engine/view.rs）と同じ形。 */

export type Phase =
  | "lunch"
  | "play"
  | "break"
  | "paused"
  | "reward"
  | "finished"
  | "ended"
  | "idle"
  | "offline";

export type Page = "home" | "start" | "settings" | "restrictions" | "account";

export type StopKind = "lunchStart" | "endTime";

export interface StopPrompt {
  kind: StopKind;
  leftSec: number;
}

export interface DailyEntry {
  date: string;
  plays: number;
  failures: number;
}

export interface WeekEntry extends DailyEntry {
  success: boolean;
}

/** 端末の設定（settings.rs）。 */
export interface SettingsView {
  playSecs: number | null;
  breakSecs: number | null;
  notify20: boolean;
  speakers: Speakers;
  /** 読み上げのショートカット。空なら無効。 */
  speakShortcut: string;
  /** 読み上げの音量（0〜100%）。 */
  speakVolume: number;
}

/** 音の出力先。空文字は既定のスピーカー。`null` は共通の設定にならう。 */
export interface Speakers {
  play: string | null;
  rest: string | null;
  notify: string | null;
  shared: string;
}

export type SoundPurpose = "play" | "break" | "notify" | "shared";

/** スタート制限（restrictions.rs の `RestrictionsForm`）。時刻は "HH:MM"、未設定は ""。 */
export interface DayForm {
  lunchStart: string;
  lunchEnd: string;
  endTime: string;
}

export interface RestrictionsForm {
  weekday: DayForm;
  weekend: DayForm;
}

export interface View {
  appRunning: boolean;
  keeping: boolean;
  phase: Phase;
  label: string;
  remainingSec: number | null;
  startedAt: number | null;
  duration: number | null;
  running: boolean;
  startBlocked: boolean;
  blockReason: string | null;
  daily: DailyEntry | null;
  week: WeekEntry[] | null;
  timerActive: boolean;
  timerRunning: boolean;
  endedBy: StopKind | null;
  stopPrompt: StopPrompt | null;
  /** クラウドへ反映できていない進化の数。 */
  pendingEvolutions: number;
  /** 今日咲いた花。 */
  bloom: "dandelion" | "peony" | "blueSpiderLily" | "nightCherry" | null;
}
