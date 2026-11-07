import { describe, expect, test } from "bun:test";
import { HEARTBEAT_MS, LiveStatusThrottle, toLiveStatus } from "./liveStatus";
import type { View } from "../types";

const view = (over: Partial<View> = {}): View => ({
  appRunning: true,
  keeping: false,
  phase: "play",
  label: "遊び",
  remainingSec: 1500,
  startedAt: 1_000,
  duration: 1800,
  running: true,
  startBlocked: false,
  blockReason: null,
  daily: { date: "2026-11-09", plays: 1, failures: 0 },
  week: [{ date: "2026-11-09", plays: 1, failures: 0, success: true }],
  timerActive: true,
  timerRunning: true,
  endedBy: null,
  stopPrompt: null,
  pendingEvolutions: 0,
  bloom: null,
  ...over,
});

describe("toLiveStatus", () => {
  test("status-kumamorun が読むキーだけを書き、画面用の項目は書かない", () => {
    const status = toLiveStatus(view(), 123);
    expect(Object.keys(status).sort()).toEqual(
      [
        "appRunning",
        "blockReason",
        "daily",
        "duration",
        "keeping",
        "label",
        "phase",
        "remainingSec",
        "running",
        "startBlocked",
        "startedAt",
        "updatedAt",
        "week",
      ].sort(),
    );
    expect(status.appRunning).toBe(true);
    expect(status.updatedAt).toBe(123);
  });

  test("Firebase は undefined を受け付けないので、無い値は null にする", () => {
    const status = toLiveStatus(view({ remainingSec: null, daily: null, week: null }), 1);
    expect(status.remainingSec).toBeNull();
    expect(status.daily).toBeNull();
    expect(status.week).toBeNull();
    expect(Object.values(status).includes(undefined as never)).toBe(false);
  });
});

describe("LiveStatusThrottle", () => {
  test("最初の1回は書く", () => {
    expect(new LiveStatusThrottle().shouldWrite(view(), 0)).toBe(true);
  });

  test("残り秒だけが変わっても、ハートビートまでは書かない", () => {
    const t = new LiveStatusThrottle();
    t.shouldWrite(view({ remainingSec: 1500 }), 0);
    expect(t.shouldWrite(view({ remainingSec: 1499 }), 1000)).toBe(false);
    expect(t.shouldWrite(view({ remainingSec: 1481 }), HEARTBEAT_MS - 1)).toBe(false);
  });

  test("20秒たつと、変化がなくても書く", () => {
    const t = new LiveStatusThrottle();
    t.shouldWrite(view(), 0);
    expect(t.shouldWrite(view(), HEARTBEAT_MS)).toBe(true);
    // 書いたので、数え直し。
    expect(t.shouldWrite(view(), HEARTBEAT_MS + 1000)).toBe(false);
  });

  test("段階・ラベル・実行状態・制限・集計が変わったらすぐ書く", () => {
    const changes: Partial<View>[] = [
      { phase: "break" },
      { label: "休憩" },
      { running: false },
      { keeping: true },
      { startedAt: 2_000 },
      { duration: 600 },
      { startBlocked: true },
      { daily: { date: "2026-11-09", plays: 2, failures: 0 } },
      { daily: { date: "2026-11-09", plays: 1, failures: 1 } },
      { week: [{ date: "2026-11-09", plays: 1, failures: 1, success: false }] },
    ];
    for (const change of changes) {
      const t = new LiveStatusThrottle();
      t.shouldWrite(view(), 0);
      expect(t.shouldWrite(view(change), 1000)).toBe(true);
    }
  });

  test("reset の後は、同じ内容でも必ず書く（再接続のとき）", () => {
    const t = new LiveStatusThrottle();
    t.shouldWrite(view(), 0);
    t.reset();
    expect(t.shouldWrite(view(), 1000)).toBe(true);
  });
});
