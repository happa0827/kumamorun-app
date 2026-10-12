import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { acceptToast, placeToastWindow, nudgeBounds, createShowToast } = require('../toast-place.js');

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const shadowPad = { top: 60, right: 60, bottom: 60, left: 60 };

const cardEdgeOffset = (workArea, placed) => ({
  right: workArea.x + workArea.width - (placed.card.x + placed.card.width),
  bottom: workArea.y + workArea.height - (placed.card.y + placed.card.height),
});

test('the card border sits 16px from the work area when the shadow can hang off-screen', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
  const placed = placeToastWindow(workArea, { width: 600, height: 280 }, {
    pad: shadowPad,
    displayBounds: workArea,
    displays: [workArea],
  });
  assert.deepEqual(cardEdgeOffset(workArea, placed), { right: 16, bottom: 16 });
  assert.equal(placed.x + placed.width, 1920 - 16 + 60);
  assert.equal(placed.y + placed.height, 1080 - 16 + 60);
  assert.equal(placed.width, 600);
  assert.equal(placed.height, 280);
});

test('a ceiled window still anchors the measured card border at 16px', () => {
  const workArea = { x: 0, y: 0, width: 1951, height: 1220 };
  const placed = placeToastWindow(workArea, { width: 601, height: 337 }, {
    pad: shadowPad,
    card: { x: 60, y: 60, right: 540, bottom: 276.698425 },
    displayBounds: workArea,
    displays: [workArea],
  });
  const offset = cardEdgeOffset(workArea, placed);
  assert.equal(offset.right, 16);
  assert.ok(Math.abs(offset.bottom - 16) < 0.5);
  assert.equal(placed.x, 1395);
});

test('a 1px window-manager shift is added back onto the requested bounds', () => {
  assert.deepEqual(
    nudgeBounds({ x: 1395, y: 927, width: 601, height: 337 }, { x: 1394, y: 926, width: 603, height: 339 }),
    { x: 1396, y: 928, width: 599, height: 335 },
  );
  assert.deepEqual(
    nudgeBounds({ x: 1395, y: 927, width: 601, height: 337 }, { x: 1350, y: 927, width: 601, height: 337 }),
    { x: 1395, y: 927, width: 601, height: 337 },
  );
});

test('padding is trimmed when hanging off the right would land on another display', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
  const beside = { x: 1920, y: 0, width: 1920, height: 1080 };
  const placed = placeToastWindow(workArea, { width: 600, height: 280 }, {
    pad: shadowPad,
    displayBounds: workArea,
    displays: [workArea, beside],
  });
  assert.deepEqual(cardEdgeOffset(workArea, placed), { right: 16, bottom: 16 });
  assert.equal(placed.x + placed.width, 1920);
  assert.ok(placed.x + placed.width <= beside.x);
  assert.equal(placed.y + placed.height, 1080 - 16 + 60);
});

test('padding is trimmed when hanging off the bottom would land on another display', () => {
  const workArea = { x: 100, y: 40, width: 1600, height: 900 };
  const displayBounds = { x: 100, y: 0, width: 1600, height: 980 };
  const below = { x: 100, y: 980, width: 1600, height: 900 };
  const placed = placeToastWindow(workArea, { width: 600, height: 280 }, {
    pad: shadowPad,
    displayBounds,
    displays: [displayBounds, below],
  });
  assert.deepEqual(cardEdgeOffset(workArea, placed), { right: 16, bottom: 16 });
  assert.equal(placed.y + placed.height, displayBounds.y + displayBounds.height);
  assert.ok(placed.y + placed.height <= below.y);
  assert.equal(placed.x + placed.width, workArea.x + workArea.width - 16 + 60);
});

test('a display beside the top of the screen does not pull the bottom-right card inward', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
  const upperRight = { x: 1920, y: 0, width: 800, height: 200 };
  const placed = placeToastWindow(workArea, { width: 600, height: 280 }, {
    pad: shadowPad,
    displayBounds: workArea,
    displays: [workArea, upperRight],
  });
  assert.deepEqual(cardEdgeOffset(workArea, placed), { right: 16, bottom: 16 });
  assert.equal(placed.width, 600);
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

test('a card wider than the work area still keeps a 16px right and bottom inset', () => {
  const workArea = { x: 0, y: 0, width: 200, height: 100 };
  const placed = placeToastWindow(workArea, { width: 500.2, height: 400 }, {
    pad: { top: 0, right: 0, bottom: 0, left: 0 },
    displayBounds: workArea,
    displays: [workArea],
  });
  assert.deepEqual(cardEdgeOffset(workArea, placed), { right: 16, bottom: 16 });
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
