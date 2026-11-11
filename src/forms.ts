/** 入力欄と Rust の値の変換。 */

/** 秒数の入力を読む。空欄・0以下・数でない値は `null`（既定時間を使う合図）。 */
export function parseSeconds(text: string): number | null {
  const value = Math.floor(Number(text.trim()));
  return text.trim() !== "" && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * 「HH:MM」の時刻までの秒数。`now` より前か同じ時刻なら翌日のその時刻とみなす。
 * 空欄・不正な値は `null`。
 */
export function secondsUntil(time: string, now: Date): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / 1000);
}

/** 時刻を「HH:MM」にする。 */
export function timeText(date: Date): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(date.getHours())}:${two(date.getMinutes())}`;
}

export function secondsText(value: number | null): string {
  return value == null ? "" : String(value);
}
