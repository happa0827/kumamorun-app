import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { acceptToast, placeToastWindow, createShowToast, TOAST_MARGIN } = require('../toast-place.js');

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('a toast is placed at the bottom-right of the work area', () => {
  assert.deepEqual(
    placeToastWindow({ x: 10, y: 20, width: 1920, height: 1080 }, { width: 320, height: 72 }),
    {
      x: 10 + 1920 - 320 - TOAST_MARGIN,
      y: 20 + 1080 - 72 - TOAST_MARGIN,
      width: 320,
      height: 72,
    },
  );
});

test('a toast larger than the work area is clamped inside the margin', () => {
  assert.deepEqual(placeToastWindow({ x: 0, y: 0, width: 200, height: 100 }, { width: 500.2, height: 400 }), {
    x: 16,
    y: 16,
    width: 168,
    height: 68,
  });
});

test('a non-numeric size is not placed', () => {
  assert.equal(placeToastWindow({ x: 0, y: 0, width: 800, height: 600 }, { width: 'nope', height: 40 }), null);
});

test('only a title and a body string are accepted', () => {
  assert.deepEqual(acceptToast({ title: '昼休憩が終わりました', body: 'また遊べるよ！' }), {
    title: '昼休憩が終わりました',
    body: 'また遊べるよ！',
  });
  assert.equal(acceptToast({ title: '終了の時間になりました', body: { body: '休憩しよう！' } }), null);
  assert.equal(acceptToast(null), null);
  assert.equal(acceptToast({ title: 1, body: 'x' }), null);
});

test('showToast sends the two strings and nothing else', () => {
  const sent = [];
  const showToast = createShowToast((payload) => sent.push(payload));
  showToast('20-20-20ルール', '20秒間、20フィート（約6m）先を見て目を休めましょう👀');
  assert.deepEqual(sent, [
    {
      title: '20-20-20ルール',
      body: '20秒間、20フィート（約6m）先を見て目を休めましょう👀',
    },
  ]);
});

test('the app window asks main to show a toast and does not mount the cards itself', () => {
  const renderer = read('renderer.js');
  const bundle = read('bundle.js');
  const main = read('main.js');
  const preload = read('preload.js');
  assert.equal(renderer.includes("from './toast.mjs'"), false);
  assert.equal(renderer.includes('createShowToast'), true);
  assert.equal(bundle.includes('toast-region'), false);
  assert.equal(preload.includes("ipcRenderer.send('toast:show'"), true);
  assert.equal(main.includes('focusable: false'), true);
  assert.equal(main.includes('skipTaskbar: true'), true);
  assert.equal(main.includes("setAlwaysOnTop(true, 'screen-saver')"), true);
  assert.equal(main.includes('showInactive()'), true);
  assert.equal(main.includes('setIgnoreMouseEvents(true, { forward: true })'), true);
  assert.equal(main.includes('placeToastWindow'), true);
});
