import { describe, expect, test } from "bun:test";
import { angleOf, formatTime, hourFromPoint, minuteFromPoint, parseTime, pointAt } from "./dial";

describe("angleOf", () => {
  test("真上が 0 度で時計回り", () => {
    expect(angleOf(0, -1)).toBeCloseTo(0);
    expect(angleOf(1, 0)).toBeCloseTo(90);
    expect(angleOf(0, 1)).toBeCloseTo(180);
    expect(angleOf(-1, 0)).toBeCloseTo(270);
  });
});

describe("pointAt", () => {
  test("90度は右", () => {
    const p = pointAt(90, 80);
    expect(p.x).toBeCloseTo(180);
    expect(p.y).toBeCloseTo(100);
  });
});

describe("hourFromPoint", () => {
  test("外側のリングは 0〜11 時", () => {
    expect(hourFromPoint(0, -80, 0.8)).toBe(0);
    expect(hourFromPoint(80, 0, 0.8)).toBe(3);
    expect(hourFromPoint(0, 80, 0.8)).toBe(6);
  });
  test("内側のリングは 12〜23 時", () => {
    expect(hourFromPoint(0, -52, 0.52)).toBe(12);
    expect(hourFromPoint(52, 0, 0.52)).toBe(15);
    expect(hourFromPoint(-52, 0, 0.52)).toBe(21);
  });
  test("11:45 付近は 0 時に丸める", () => {
    expect(hourFromPoint(-1, -80, 0.8)).toBe(0);
  });
});

describe("minuteFromPoint", () => {
  test("1分刻み", () => {
    expect(minuteFromPoint(0, -1)).toBe(0);
    expect(minuteFromPoint(1, 0)).toBe(15);
    expect(minuteFromPoint(0, 1)).toBe(30);
    expect(minuteFromPoint(-1, 0)).toBe(45);
    expect(minuteFromPoint(-0.01, -1)).toBe(0);
  });
});

describe("parseTime / formatTime", () => {
  test("読み書き", () => {
    expect(parseTime("09:05")).toEqual({ hour: 9, minute: 5 });
    expect(parseTime("")).toBeNull();
    expect(parseTime("24:00")).toBeNull();
    expect(formatTime(9, 5)).toBe("09:05");
  });
});
