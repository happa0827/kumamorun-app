/** users/{uid}/liveStatus に書く内容と、書く頻度の規則。status-kumamorun が読むのでキーは固定。 */

import type { View } from "../types";

/** 変化がなくても、この間隔で書く（残り秒の更新）。毎秒は書かない。 */
export const HEARTBEAT_MS = 20_000;

/** View のうち、サイトへ渡す分だけを取り出す。画面用の項目は含めない。 */
export function toLiveStatus(view: View, updatedAt: number) {
  return {
    appRunning: true,
    keeping: view.keeping,
    phase: view.phase,
    label: view.label,
    remainingSec: view.remainingSec ?? null,
    startedAt: view.startedAt ?? null,
    duration: view.duration ?? null,
    running: view.running,
    startBlocked: view.startBlocked,
    blockReason: view.blockReason ?? null,
    daily: view.daily ?? null,
    week: view.week ?? null,
    updatedAt,
  };
}

/** 残り秒と blockReason 以外の変化を見分ける印。 */
function fingerprint(view: View): string {
  return [
    view.phase,
    view.label,
    view.running,
    view.keeping,
    view.startedAt,
    view.duration,
    view.startBlocked,
    view.daily?.date,
    view.daily?.plays,
    view.daily?.failures,
    view.week?.map((d) => `${d.date}:${d.plays}:${d.failures}`).join(","),
  ].join("|");
}

export class LiveStatusThrottle {
  private lastFingerprint: string | null = null;
  private lastWriteAt = 0;

  /** 今書くべきなら true を返し、書いたものとして数え直す。 */
  shouldWrite(view: View, nowMs: number): boolean {
    const print = fingerprint(view);
    const changed = print !== this.lastFingerprint;
    const heartbeatDue = nowMs - this.lastWriteAt >= HEARTBEAT_MS;
    if (!changed && !heartbeatDue) return false;
    this.lastFingerprint = print;
    this.lastWriteAt = nowMs;
    return true;
  }

  /** 次は必ず書く。再接続のあとなど。 */
  reset(): void {
    this.lastFingerprint = null;
    this.lastWriteAt = 0;
  }
}
