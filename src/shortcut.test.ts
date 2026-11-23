import { describe, expect, test } from "bun:test";
import { acceleratorFromKey, shortcutLabel, type KeyInfo } from "./shortcut";

const key = (over: Partial<KeyInfo>): KeyInfo => ({
  key: "t",
  code: "KeyT",
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...over,
});

describe("acceleratorFromKey", () => {
  test("修飾キーと英字の組み合わせをショートカットの文字列にする", () => {
    expect(acceleratorFromKey(key({ ctrlKey: true, altKey: true }))).toBe("CommandOrControl+Alt+T");
    expect(acceleratorFromKey(key({ altKey: true, shiftKey: true, code: "KeyK", key: "K" }))).toBe(
      "Alt+Shift+K",
    );
  });

  test("数字とファンクションキーも使える", () => {
    expect(acceleratorFromKey(key({ ctrlKey: true, code: "Digit5", key: "5" }))).toBe(
      "CommandOrControl+5",
    );
    expect(acceleratorFromKey(key({ ctrlKey: true, code: "F11", key: "F11" }))).toBe(
      "CommandOrControl+F11",
    );
  });

  test("修飾キーが無ければ受け付けない", () => {
    expect(acceleratorFromKey(key({}))).toBeNull();
    expect(acceleratorFromKey(key({ code: "F5", key: "F5" }))).toBeNull();
  });

  test("修飾キーだけを押した間は決まらない", () => {
    expect(
      acceleratorFromKey(key({ ctrlKey: true, code: "ControlLeft", key: "Control" })),
    ).toBeNull();
    expect(acceleratorFromKey(key({ altKey: true, code: "AltLeft", key: "Alt" }))).toBeNull();
  });

  test("使えないキーは受け付けない", () => {
    expect(acceleratorFromKey(key({ ctrlKey: true, code: "Space", key: " " }))).toBeNull();
    expect(acceleratorFromKey(key({ ctrlKey: true, code: "Enter", key: "Enter" }))).toBeNull();
  });

  test("Windows キーとの組み合わせは受け付けない", () => {
    expect(acceleratorFromKey(key({ metaKey: true }))).toBeNull();
    expect(acceleratorFromKey(key({ metaKey: true, ctrlKey: true }))).toBeNull();
  });
});

describe("shortcutLabel", () => {
  test("画面には Ctrl と書く", () => {
    expect(shortcutLabel("CommandOrControl+Alt+T")).toBe("Ctrl+Alt+T");
  });
  test("空なら無効", () => {
    expect(shortcutLabel("")).toBe("無効");
  });
});
