import { describe, expect, test } from "bun:test";
import { parseSeconds, secondsText, secondsUntil, timeText } from "./forms";

describe("parseSeconds", () => {
  test("正の数はそのまま", () => {
    expect(parseSeconds("1200")).toBe(1200);
    expect(parseSeconds(" 90 ")).toBe(90);
  });
  test("空欄は null（Rust が既定時間を使う）", () => {
    expect(parseSeconds("")).toBeNull();
    expect(parseSeconds("   ")).toBeNull();
  });
  test("0以下や数でない値は null", () => {
    expect(parseSeconds("0")).toBeNull();
    expect(parseSeconds("-5")).toBeNull();
    expect(parseSeconds("abc")).toBeNull();
  });
  test("小数は切り捨てる", () => {
    expect(parseSeconds("90.9")).toBe(90);
  });
});

describe("secondsUntil", () => {
  const now = new Date(2026, 10, 11, 14, 30, 15);
  test("今日の後の時刻までの秒数", () => {
    expect(secondsUntil("15:00", now)).toBe(29 * 60 + 45);
  });
  test("過ぎた時刻・同じ時刻は翌日", () => {
    expect(secondsUntil("14:30", now)).toBe(24 * 3600 - 15);
    expect(secondsUntil("09:00", now)).toBe(18 * 3600 + 29 * 60 + 45);
  });
  test("空欄や不正な値は null", () => {
    expect(secondsUntil("", now)).toBeNull();
    expect(secondsUntil("25:00", now)).toBeNull();
    expect(secondsUntil("abc", now)).toBeNull();
  });
});

describe("timeText", () => {
  test("HH:MM にする", () => {
    expect(timeText(new Date(2026, 10, 11, 9, 5, 30))).toBe("09:05");
    expect(timeText(new Date(2026, 10, 11, 23, 59))).toBe("23:59");
  });
});

describe("secondsText", () => {
  test("入力欄に出す文字", () => {
    expect(secondsText(1200)).toBe("1200");
    expect(secondsText(null)).toBe("");
  });
});
