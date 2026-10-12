import { showToast, onToastStack } from './toast.mjs';

const api = window.kumamorunAPI;

const report = () => {
  const region = document.querySelector('.toast-region');
  if (!region || !api) return;
  const rect = region.getBoundingClientRect();
  const style = getComputedStyle(region);
  // 入場アニメの translate は枠の位置に含めない。含めると止まったあと下へずれる。
  const boxes = [...region.querySelectorAll('.toast')].map((el) => {
    const box = el.getBoundingClientRect();
    const transform = getComputedStyle(el).transform;
    const match = transform && transform.match(/^matrix\(([^)]+)\)$/);
    const parts = match ? match[1].split(',').map(Number) : [];
    const dx = parts.length >= 6 ? parts[4] : 0;
    const dy = parts.length >= 6 ? parts[5] : 0;
    return {
      left: box.left - dx,
      top: box.top - dy,
      right: box.right - dx,
      bottom: box.bottom - dy,
    };
  });
  const card = boxes.length
    ? {
      cardLeft: Math.min(...boxes.map((box) => box.left)),
      cardTop: Math.min(...boxes.map((box) => box.top)),
      cardRight: Math.max(...boxes.map((box) => box.right)),
      cardBottom: Math.max(...boxes.map((box) => box.bottom)),
    }
    : { cardLeft: 0, cardTop: 0, cardRight: 0, cardBottom: 0 };
  api.toastLayout({
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
    count: region.children.length,
    padTop: parseFloat(style.paddingTop) || 0,
    padRight: parseFloat(style.paddingRight) || 0,
    padBottom: parseFloat(style.paddingBottom) || 0,
    padLeft: parseFloat(style.paddingLeft) || 0,
    ...card,
  });
};

let current = null;
onToastStack((count) => {
  if (count === 0) current = null;
  report();
});

api.onToast((payload) => {
  showToast(payload.title, payload.body);
});

// 無視中でも mousemove は届く。カードの上だけマウスを受け取り、出入りで保持と再開を切り替える。
window.addEventListener('mousemove', (event) => {
  const target = event.target;
  const card = target && typeof target.closest === 'function' ? target.closest('.toast') : null;
  if (card !== current) {
    if (current) current.dispatchEvent(new Event('pointerleave'));
    current = card;
    api.toastInteractive(!!card);
  }
  if (card) card.dispatchEvent(new Event('pointerenter'));
});
