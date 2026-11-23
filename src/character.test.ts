import { describe, expect, test } from "bun:test";
import { characterKey, clampStage } from "./character";

describe("characterKey", () => {
  test("開花した日は花の名前", () => {
    expect(characterKey(3, "peony")).toBe("peony");
    expect(characterKey(null, "nightCherry")).toBe("nightCherry");
  });

  test("それ以外は成長段階", () => {
    expect(characterKey(0, null)).toBe("stage0");
    expect(characterKey(5, null)).toBe("stage5");
  });

  test("未取得は0、範囲外は丸める", () => {
    expect(characterKey(null, null)).toBe("stage0");
    expect(characterKey(6, null)).toBe("stage5");
    expect(clampStage(-1)).toBe(0);
  });
});
