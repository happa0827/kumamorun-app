import { describe, expect, test } from "bun:test";
import { parseSeconds, secondsText } from "./forms";

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

describe("secondsText", () => {
  test("入力欄に出す文字", () => {
    expect(secondsText(1200)).toBe("1200");
    expect(secondsText(null)).toBe("");
  });
});
