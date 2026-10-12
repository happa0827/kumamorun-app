// トースト窓の位置と、IPC で届いた文言の受け取り。
// Electron を import しない。テストはここを直接呼ぶ。

const TOAST_MARGIN = 16;

const acceptToast = (payload) => {
  if (!payload || typeof payload.title !== 'string' || typeof payload.body !== 'string') return null;
  return { title: payload.title, body: payload.body };
};

const finite = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sameBounds = (a, b) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

const overlaps = (a, b) =>
  a.width > 0 &&
  a.height > 0 &&
  b.width > 0 &&
  b.height > 0 &&
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

const hitsAnotherDisplay = (rect, displayBounds, displays) =>
  (displays || []).some((bounds) => !sameBounds(bounds, displayBounds) && overlaps(rect, bounds));

// カードの右端・下端を作業領域から TOAST_MARGIN に置く。
// 影の余白は画面の外へ出してよい。隣のディスプレイに入る分だけ余白を削る。
const placeToastWindow = (workArea, size, options) => {
  const widthIn = finite(size && size.width, NaN);
  const heightIn = finite(size && size.height, NaN);
  if (!Number.isFinite(widthIn) || !Number.isFinite(heightIn)) return null;

  const padIn = (options && options.pad) || {};
  const pad = {
    top: Math.max(0, finite(padIn.top, 0)),
    right: Math.max(0, finite(padIn.right, 0)),
    bottom: Math.max(0, finite(padIn.bottom, 0)),
    left: Math.max(0, finite(padIn.left, 0)),
  };
  const width = Math.max(1, Math.ceil(widthIn));
  const height = Math.max(1, Math.ceil(heightIn));
  const cardIn = options && options.card;
  const cardBox = cardIn && finite(cardIn.right, 0) > 0 && finite(cardIn.bottom, 0) > 0
    ? {
      x: finite(cardIn.x, 0),
      y: finite(cardIn.y, 0),
      right: finite(cardIn.right, 0),
      bottom: finite(cardIn.bottom, 0),
    }
    : {
      x: pad.left,
      y: pad.top,
      right: Math.max(pad.left + 1, width - pad.right),
      bottom: Math.max(pad.top + 1, height - pad.bottom),
    };

  const workRight = workArea.x + workArea.width;
  const workBottom = workArea.y + workArea.height;

  let x = Math.round(workRight - TOAST_MARGIN - cardBox.right);
  let y = Math.round(workBottom - TOAST_MARGIN - cardBox.bottom);
  let w = width;
  let h = height;

  const displayBounds = (options && options.displayBounds) || workArea;
  const displays = (options && options.displays) || [displayBounds];
  const displayRight = displayBounds.x + displayBounds.width;
  const displayBottom = displayBounds.y + displayBounds.height;

  const minWidth = Math.max(1, Math.ceil(cardBox.right));
  const minHeight = Math.max(1, Math.ceil(cardBox.bottom));
  const rightOverflow = { x: displayRight, y, width: Math.max(0, x + w - displayRight), height: h };
  if (hitsAnotherDisplay(rightOverflow, displayBounds, displays)) {
    w = Math.max(minWidth, displayRight - x);
  }

  const bottomOverflow = { x, y: displayBottom, width: w, height: Math.max(0, y + h - displayBottom) };
  if (hitsAnotherDisplay(bottomOverflow, displayBounds, displays)) {
    h = Math.max(minHeight, displayBottom - y);
  }

  return {
    x,
    y,
    width: w,
    height: h,
    card: {
      x: x + cardBox.x,
      y: y + cardBox.y,
      width: cardBox.right - cardBox.x,
      height: cardBox.bottom - cardBox.y,
    },
  };
};

// setBounds が数 px ずれるとき、同じずれを足して要求した位置に戻す。
// 画面内へ大きく押し戻された場合は足さない（隣のディスプレイへ押し出さない）。
const nudgeBounds = (requested, actual) => {
  const dx = requested.x - actual.x;
  const dy = requested.y - actual.y;
  const dw = requested.width - actual.width;
  const dh = requested.height - actual.height;
  const small = [dx, dy, dw, dh].every((delta) => Math.abs(delta) <= 4);
  if (!small) {
    return { x: requested.x, y: requested.y, width: requested.width, height: requested.height };
  }
  return {
    x: requested.x + dx,
    y: requested.y + dy,
    width: requested.width + dw,
    height: requested.height + dh,
  };
};

// 呼び出し側は { title, body } を渡すだけ。窓の生成は main の仕事。
const createShowToast = (send) => (title, body) => {
  send({ title, body });
};

module.exports = {
  TOAST_MARGIN,
  acceptToast,
  placeToastWindow,
  nudgeBounds,
  createShowToast,
};
