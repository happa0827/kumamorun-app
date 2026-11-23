/** 画面に出す文言の規則。状態は Rust が持ち、ここは見せ方だけを決める。 */

import type { StopPrompt, View } from "./types";

/** 秒数を mm:ss にする（例: 90 -> "01:30"）。 */
export function formatTime(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const ENDED_BY_TEXT = {
  lunchStart: "昼休憩の時間です",
  endTime: "終了の時間です",
} as const;

export function display(view: View): { label: string; remaining: string } {
  switch (view.phase) {
    case "idle":
    case "offline":
      return { label: "", remaining: "-" };
    case "finished":
      return { label: view.label, remaining: "時間切れ！" };
    case "ended":
      return {
        label: view.label,
        remaining: view.endedBy ? ENDED_BY_TEXT[view.endedBy] : "時間切れ！",
      };
    default:
      return { label: view.label, remaining: formatTime(view.remainingSec ?? 0) };
  }
}

export function toggleLabel(view: View): string {
  return view.timerRunning ? "一時停止" : "再開";
}

const QUIT_PROMPT = {
  lunchStart: "昼休憩だよ。やめた？",
  endTime: "今日はここまで？",
} as const;

export function quitMessage(prompt: StopPrompt): string {
  return `${QUIT_PROMPT[prompt.kind]}（残り${prompt.leftSec}秒）`;
}
