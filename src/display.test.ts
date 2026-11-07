import { describe, expect, test } from "bun:test";
import { display, formatTime, quitMessage, toggleLabel } from "./display";
import type { View } from "./types";

const base: View = {
  appRunning: true,
  keeping: false,
  phase: "idle",
  label: "",
  remainingSec: null,
  startedAt: null,
  duration: null,
  running: false,
  startBlocked: false,
  blockReason: null,
  daily: { date: "2026-11-09", plays: 0, failures: 0 },
  week: [],
  timerActive: false,
  timerRunning: false,
  endedBy: null,
  stopPrompt: null,
};

const view = (patch: Partial<View>): View => ({ ...base, ...patch });

describe("formatTime", () => {
  test("mm:ss にする", () => {
    expect(formatTime(90)).toBe("01:30");
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(5)).toBe("00:05");
  });
  test("60分を超えても分のまま", () => {
    expect(formatTime(3600)).toBe("60:00");
    expect(formatTime(6005)).toBe("100:05");
  });
});

describe("display", () => {
  test("待機は何も出さない", () => {
    expect(display(view({}))).toEqual({ label: "", remaining: "-" });
  });
  test("稼働中は残りとラベル", () => {
    expect(
      display(view({ phase: "play", label: "遊び", remainingSec: 1500 })),
    ).toEqual({ label: "遊び", remaining: "25:00" });
  });
  test("境界までの表示はラベルに従う", () => {
    expect(
      display(view({ phase: "play", label: "遊び（昼休憩まで）", remainingSec: 90 })),
    ).toEqual({ label: "遊び（昼休憩まで）", remaining: "01:30" });
  });
  test("一時停止中も残りを出す", () => {
    expect(
      display(view({ phase: "paused", label: "休憩", remainingSec: 61 })),
    ).toEqual({ label: "休憩", remaining: "01:01" });
  });
  test("昼休憩", () => {
    expect(
      display(view({ phase: "lunch", label: "昼休憩中（終了まで）", remainingSec: 1800 })),
    ).toEqual({ label: "昼休憩中（終了まで）", remaining: "30:00" });
  });
  test("休憩の猶予", () => {
    expect(
      display(view({ phase: "reward", label: "休憩の猶予", remainingSec: 120 })),
    ).toEqual({ label: "休憩の猶予", remaining: "02:00" });
  });
  test("時間切れ", () => {
    expect(display(view({ phase: "finished", label: "遊び" }))).toEqual({
      label: "遊び",
      remaining: "時間切れ！",
    });
  });
  test("打ち切りは理由を出す", () => {
    expect(
      display(view({ phase: "ended", label: "遊び", endedBy: "lunchStart" })),
    ).toEqual({ label: "遊び", remaining: "昼休憩の時間です" });
    expect(
      display(view({ phase: "ended", label: "遊び", endedBy: "endTime" })),
    ).toEqual({ label: "遊び", remaining: "終了の時間です" });
  });
  test("残りが欠けていても 00:00 にする", () => {
    expect(display(view({ phase: "play", label: "遊び", remainingSec: null }))).toEqual({
      label: "遊び",
      remaining: "00:00",
    });
  });
});

describe("toggleLabel", () => {
  test("動いていれば一時停止、止まっていれば再開", () => {
    expect(toggleLabel(view({ timerActive: true, timerRunning: true }))).toBe("一時停止");
    expect(toggleLabel(view({ timerActive: true, timerRunning: false }))).toBe("再開");
  });
});

describe("quitMessage", () => {
  test("種類ごとの問いかけと残り秒", () => {
    expect(quitMessage({ kind: "lunchStart", leftSec: 120 })).toBe(
      "昼休憩だよ。やめた？（残り120秒）",
    );
    expect(quitMessage({ kind: "endTime", leftSec: 5 })).toBe(
      "今日はここまで？（残り5秒）",
    );
  });
});
