import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { acceptToast, placeToastWindow, createShowToast, TOAST_MARGIN } = require('../toast-place.js');

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('a 30rem card plus shadow gutter sits at the bottom-right of the work area', () => {
  const width = 30 * 16 + 7.5 * 16;
  const height = 280;
  assert.equal(width, 600);
  assert.deepEqual(
    placeToastWindow({ x: 10, y: 20, width: 1920, height: 1080 }, { width, height }),
    {
      x: 10 + 1920 - width - TOAST_MARGIN,
      y: 20 + 1080 - height - TOAST_MARGIN,
      width,
      height,
    },
  );
});

test('the desktop card is larger, accent-bordered, and padded for its shadow', () => {
  const css = read('styles.css');
  const host = css.match(/body\.toast-host \.toast-region\s*\{([^}]*)\}/);
  assert.ok(host, 'toast host region');
  assert.match(host[1], /width:\s*calc\(30rem \+ 7\.5rem\)/);
  assert.match(host[1], /padding:\s*3\.75rem/);
  const card = css.match(/\.toast\s*\{([^}]*)\}/);
  assert.ok(card, 'toast card');
  assert.match(card[1], /border:\s*3px solid var\(--accent\)/);
  assert.match(card[1], /padding:\s*1\.15rem 3\.5rem 1\.15rem 1\.45rem/);
  assert.match(css, /\.toast-title\s*\{[^}]*font-size:\s*1\.3rem/);
  assert.match(css, /\.toast-body\s*\{[^}]*font-size:\s*1\.15rem/);
  assert.match(css, /\.toast-body\s*\{[^}]*color:\s*var\(--text\)/);
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
