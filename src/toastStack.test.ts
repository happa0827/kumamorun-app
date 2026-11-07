import { beforeEach, describe, expect, test } from "bun:test";
import { TOAST_MS, ToastStack, type Scheduler, type ToastItem } from "./toastStack";

/** 手で時間を進められる時計。 */
class FakeClock implements Scheduler {
  now = 0;
  private next = 1;
  private tasks = new Map<number, { at: number; fn: () => void }>();

  setTimeout(fn: () => void, ms: number): number {
    const id = this.next++;
    this.tasks.set(id, { at: this.now + ms, fn });
    return id;
  }

  clearTimeout(handle: unknown): void {
    this.tasks.delete(handle as number);
  }

  tick(ms: number): void {
    const end = this.now + ms;
    for (;;) {
      const due = [...this.tasks.entries()]
        .filter(([, task]) => task.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      this.tasks.delete(due[0]);
      this.now = due[1].at;
      due[1].fn();
    }
    this.now = end;
  }
}

let clock: FakeClock;
let stack: ToastStack;
let counts: number[];

const visible = (items: ToastItem[]) => items.map((t) => [t.title, t.body]);

beforeEach(() => {
  clock = new FakeClock();
  counts = [];
  stack = new ToastStack(clock, (items) => counts.push(items.length));
});

describe("ToastStack", () => {
  test("古いものが上、新しいものが下に積まれる", () => {
    stack.show("昼休憩の時間になりました", "休憩しよう！");
    stack.show("20-20-20ルール", "20秒間、20フィート（約6m）先を見て目を休めましょう👀");
    stack.show("遊び まもなく終了", "残り5分です");
    expect(visible(stack.items)).toEqual([
      ["昼休憩の時間になりました", "休憩しよう！"],
      ["20-20-20ルール", "20秒間、20フィート（約6m）先を見て目を休めましょう👀"],
      ["遊び まもなく終了", "残り5分です"],
    ]);
  });

  test("表示から6000ミリ秒で、それぞれ独立に消える", () => {
    expect(TOAST_MS).toBe(6000);
    stack.show("遊び が終わりました", "お疲れさまでした！");
    clock.tick(1000);
    stack.show("進化した！✨", "くまもーるんが育ったよ！");
    clock.tick(4999);
    expect(stack.items.length).toBe(2);
    clock.tick(1);
    expect(visible(stack.items)).toEqual([["進化した！✨", "くまもーるんが育ったよ！"]]);
    clock.tick(1000);
    expect(stack.items).toEqual([]);
  });

  test("閉じるは自分のカードだけを消し、もう一度押しても何も変わらない", () => {
    const a = stack.show("昼休憩が終わりました", "また遊べるよ！");
    const b = stack.show("お花が咲いた！🌸", "夜桜 が咲きました！お花+2");
    const c = stack.show("終了の時間になりました", "今日はここまで。お疲れさまでした！");
    stack.dismiss(b);
    stack.dismiss(b);
    expect(stack.items.map((t) => t.id)).toEqual([a, c]);
    clock.tick(6000);
    expect(stack.items).toEqual([]);
  });

  test("カーソルが載っている間は保持し、離れたら6000ミリ秒を数え直す", () => {
    const id = stack.show("昼休憩が終わりました", "また遊べるよ！");
    clock.tick(3000);
    stack.hold(id);
    clock.tick(60_000);
    expect(stack.items.length).toBe(1);
    stack.release(id);
    clock.tick(5999);
    expect(stack.items.length).toBe(1);
    clock.tick(1);
    expect(stack.items).toEqual([]);
  });

  test("保持していないカードの release は何もしない", () => {
    const id = stack.show("a", "b");
    clock.tick(5000);
    stack.release(id);
    // 数え直さず、元の時刻（表示から6000ミリ秒）に消える。
    clock.tick(1000);
    expect(stack.items).toEqual([]);
  });

  test("消えたカードへの操作は無視する", () => {
    const id = stack.show("a", "b");
    stack.dismiss(id);
    stack.hold(id);
    stack.release(id);
    clock.tick(60_000);
    expect(stack.items).toEqual([]);
  });

  test("変化のたびに残りの枚数を知らせる", () => {
    const first = stack.show("遊び が終わりました", "お疲れさまでした！");
    stack.show("進化した！✨", "くまもーるんが育ったよ！");
    stack.dismiss(first);
    expect(counts).toEqual([1, 2, 1]);
    clock.tick(6000);
    expect(counts).toEqual([1, 2, 1, 0]);
  });

  test("idはカードごとに違う", () => {
    const a = stack.show("a", "b");
    const b = stack.show("a", "b");
    expect(a).not.toBe(b);
  });
});
