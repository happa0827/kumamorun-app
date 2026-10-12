import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parent = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.ownText = '';
  }
  get textContent() {
    return this.ownText + this.children.map((child) => child.textContent).join('');
  }
  set textContent(value) {
    this.ownText = String(value);
    this.children = [];
  }
  get innerHTML() {
    throw new Error('innerHTML');
  }
  set innerHTML(_value) {
    throw new Error('innerHTML');
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
  append(...nodes) {
    for (const node of nodes) {
      node.remove();
      node.parent = this;
      this.children.push(node);
    }
  }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }
  addEventListener(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ type, target: this, currentTarget: this });
    }
  }
}

const createFakeDocument = () => {
  const documentElement = new FakeElement('html');
  const body = new FakeElement('body');
  documentElement.append(body);
  return { documentElement, body, createElement: (tagName) => new FakeElement(tagName) };
};

globalThis.document = createFakeDocument();
const { showToast } = await import('../toast.mjs');

const region = document.body.children.find((el) => el.getAttribute('aria-live') === 'polite');
const visible = () =>
  region.children.map((toast) =>
    toast.children.filter((el) => el.tagName !== 'BUTTON').map((el) => el.textContent),
  );
const closeButtonOf = (toast) =>
  toast.children.find((el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === '閉じる');

beforeEach(() => mock.timers.enable({ apis: ['setTimeout'] }));
afterEach(() => {
  for (const toast of [...(region?.children ?? [])]) toast.remove();
  mock.timers.reset();
});

test('the polite live region is in the page before any toast is shown', () => {
  assert.equal(region?.getAttribute('aria-live'), 'polite');
  assert.equal(region.children.length, 0);
});

test('stacks toasts oldest first, newest last at the bottom-right corner', () => {
  showToast('昼休憩の時間になりました', '休憩しよう！');
  showToast('20-20-20ルール', '20秒間、20フィート（約6m）先を見て目を休めましょう👀');
  showToast('遊び まもなく終了', '残り5分です');
  assert.deepEqual(visible(), [
    ['昼休憩の時間になりました', '休憩しよう！'],
    ['20-20-20ルール', '20秒間、20フィート（約6m）先を見て目を休めましょう👀'],
    ['遊び まもなく終了', '残り5分です'],
  ]);
});

test('each toast leaves 6000 ms after it appeared, independent of the others', () => {
  showToast('遊び が終わりました', 'お疲れさまでした！');
  mock.timers.tick(1000);
  showToast('進化した！✨', 'くまもーるんが育ったよ！');
  mock.timers.tick(4999);
  assert.deepEqual(visible(), [
    ['遊び が終わりました', 'お疲れさまでした！'],
    ['進化した！✨', 'くまもーるんが育ったよ！'],
  ]);
  mock.timers.tick(1);
  assert.deepEqual(visible(), [['進化した！✨', 'くまもーるんが育ったよ！']]);
  mock.timers.tick(1000);
  assert.deepEqual(visible(), []);
});

test('閉じる removes only its own toast, and pressing it again changes nothing', () => {
  showToast('昼休憩が終わりました', 'また遊べるよ！');
  showToast('お花が咲いた！🌸', '夜桜 が咲きました！お花+2');
  showToast('終了の時間になりました', '今日はここまで。お疲れさまでした！');
  const middle = region.children[1];
  closeButtonOf(middle).dispatch('click');
  closeButtonOf(middle).dispatch('click');
  assert.deepEqual(visible(), [
    ['昼休憩が終わりました', 'また遊べるよ！'],
    ['終了の時間になりました', '今日はここまで。お疲れさまでした！'],
  ]);
  mock.timers.tick(6000);
  assert.deepEqual(visible(), []);
});

test('hovering holds a toast; leaving restarts the full 6000 ms', () => {
  showToast('昼休憩が終わりました', 'また遊べるよ！');
  const toast = region.children[0];
  mock.timers.tick(3000);
  toast.dispatch('pointerenter');
  mock.timers.tick(60_000);
  assert.deepEqual(visible(), [['昼休憩が終わりました', 'また遊べるよ！']]);
  toast.dispatch('pointerleave');
  mock.timers.tick(5999);
  assert.deepEqual(visible(), [['昼休憩が終わりました', 'また遊べるよ！']]);
  mock.timers.tick(1);
  assert.deepEqual(visible(), []);
});

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');

test('neither the sources nor the committed bundle reach for OS notifications', () => {
  const sources = readdirSync(root).filter((f) => /\.m?js$/.test(f));
  assert.ok(['renderer.js', 'main.js', 'bundle.js'].every((f) => sources.includes(f)), `scanned ${sources}`);
  const offenders = sources
    .map((file) => [file, read(file).match(/\bNotification\b/g)?.length ?? 0])
    .filter(([, count]) => count > 0);
  assert.deepEqual(offenders, []);
});

test('main grants the media permission and no longer grants notifications', () => {
  const main = read('main.js');
  assert.equal(main.includes("permission === 'media'"), true, 'main.js dropped the media grant');
  assert.equal(main.includes("'notifications'"), false, 'main.js still grants notifications');
});

test('the toast layer sits above both overlays and below the dev banner', () => {
  const css = read('styles.css');
  const zIndex = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const found = new RegExp(`${escaped}\\s*\\{`).exec(css);
    assert.ok(found, `missing ${selector}`);
    const open = found.index + found[0].length - 1;
    let depth = 0;
    let close = open;
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    const block = css.slice(open + 1, close);
    const value = block.match(/z-index\s*:\s*(-?\d+(?:\.\d+)?)/);
    assert.ok(value, `${selector} z-index`);
    return Number(value[1]);
  };
  const toast = zIndex('.toast-region');
  const quit = zIndex('.quit-confirm-overlay');
  const focus = zIndex('.focus-overlay');
  const banner = zIndex('.dev-banner');
  assert.ok(toast > quit, `toast ${toast} quit ${quit}`);
  assert.ok(toast > focus, `toast ${toast} focus ${focus}`);
  assert.ok(toast < banner, `toast ${toast} banner ${banner}`);
});
