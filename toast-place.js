// トースト窓の位置と、IPC で届いた文言の受け取り。
// Electron を import しない。テストはここを直接呼ぶ。

const TOAST_MARGIN = 16;

const acceptToast = (payload) => {
  if (!payload || typeof payload.title !== 'string' || typeof payload.body !== 'string') return null;
  return { title: payload.title, body: payload.body };
};

const placeToastWindow = (workArea, size) => {
  const widthIn = Number(size && size.width);
  const heightIn = Number(size && size.height);
  if (!Number.isFinite(widthIn) || !Number.isFinite(heightIn)) return null;
  const maxWidth = Math.max(1, workArea.width - TOAST_MARGIN * 2);
  const maxHeight = Math.max(1, workArea.height - TOAST_MARGIN * 2);
  const width = Math.min(maxWidth, Math.max(1, Math.ceil(widthIn)));
  const height = Math.min(maxHeight, Math.max(1, Math.ceil(heightIn)));
  return {
    x: Math.round(workArea.x + workArea.width - width - TOAST_MARGIN),
    y: Math.round(workArea.y + workArea.height - height - TOAST_MARGIN),
    width,
    height,
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
  createShowToast,
};
