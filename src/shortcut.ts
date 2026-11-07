/** 読み上げのショートカットを、キー入力から作る。登録は Rust が行う。 */

export interface KeyInfo {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * Ctrl / Alt / Shift のどれかと、英字・数字・F1〜F12 の組み合わせだけを受け付ける。
 * 決まらないとき（修飾キーだけ、使えないキー）は `null`。
 */
export function acceleratorFromKey(e: KeyInfo): string | null {
  if (e.metaKey) return null;
  if (!e.ctrlKey && !e.altKey && !e.shiftKey) return null;

  let main: string | null = null;
  const letter = /^Key([A-Z])$/.exec(e.code);
  const digit = /^Digit(\d)$/.exec(e.code);
  const fn = /^F([1-9]|1[0-2])$/.exec(e.code);
  if (letter) main = letter[1];
  else if (digit) main = digit[1];
  else if (fn) main = `F${fn[1]}`;
  if (!main) return null;

  const parts = [];
  if (e.ctrlKey) parts.push("CommandOrControl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  parts.push(main);
  return parts.join("+");
}

/** 画面に出す表記。 */
export function shortcutLabel(accelerator: string): string {
  return accelerator ? accelerator.replace("CommandOrControl", "Ctrl") : "無効";
}
