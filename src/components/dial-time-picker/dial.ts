/** 時計のダイアルの座標計算。盤面は viewBox 200×200、中心は (100, 100)。 */

export const CENTER = 100;
/** 外側のリング（0〜11 時、分）と内側のリング（12〜23 時）の半径。 */
export const OUTER_RADIUS = 80;
export const INNER_RADIUS = 52;

/** 12 時の位置（真上）から時計回りに測った角度（度）。 */
export function angleOf(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/** 盤面上の位置。`angle` は真上から時計回りの度数。 */
export function pointAt(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return { x: CENTER + radius * Math.sin(radians), y: CENTER - radius * Math.cos(radians) };
}

/**
 * ポインタの位置（盤面の中心からの差と、盤面の半径に対する距離の割合 0〜1）から時を決める。
 * 外側のリングは 0〜11 時、内側のリングは 12〜23 時。
 */
export function hourFromPoint(dx: number, dy: number, ratio: number): number {
  const index = Math.round(angleOf(dx, dy) / 30) % 12;
  const boundary = (INNER_RADIUS + OUTER_RADIUS) / 2 / 100;
  return ratio < boundary ? index + 12 : index;
}

/** ポインタの角度から分（0〜59）を決める。 */
export function minuteFromPoint(dx: number, dy: number): number {
  return Math.round(angleOf(dx, dy) / 6) % 60;
}

/** 時のつまみの角度と半径。 */
export function hourHand(hour: number): { angle: number; radius: number } {
  return { angle: (hour % 12) * 30, radius: hour >= 12 ? INNER_RADIUS : OUTER_RADIUS };
}

export function minuteHand(minute: number): { angle: number; radius: number } {
  return { angle: minute * 6, radius: OUTER_RADIUS };
}

/** 「HH:mm」を時と分に分ける。空欄・不正な値は null。 */
export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
