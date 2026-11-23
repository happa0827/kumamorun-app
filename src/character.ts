import type { View } from "./types";

/** 成長段階の数（0〜5）。 */
export const STAGE_COUNT = 6;

/** 仕様変更前の段階6以上は最後の段階に丸める。未取得は 0。 */
export function clampStage(stage: number | null): number {
  return Math.min(Math.max(stage ?? 0, 0), STAGE_COUNT - 1);
}

/**
 * 完全版の画像の名前（Rust の `characters::KEYS`）。開花した日はその花、それ以外は成長段階。
 * 花の名前は `View["bloom"]` と同じ。
 */
export function characterKey(stage: number | null, bloom: View["bloom"]): string {
  return bloom ?? `stage${clampStage(stage)}`;
}
