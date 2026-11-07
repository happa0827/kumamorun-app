/** 入力欄と Rust の値の変換。 */

/** 秒数の入力を読む。空欄・0以下・数でない値は `null`（既定時間を使う合図）。 */
export function parseSeconds(text: string): number | null {
  const value = Math.floor(Number(text.trim()));
  return text.trim() !== "" && Number.isFinite(value) && value > 0 ? value : null;
}

export function secondsText(value: number | null): string {
  return value == null ? "" : String(value);
}
