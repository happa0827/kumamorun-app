import { showToast, onToastStack } from './toast.mjs';

const api = window.kumamorunAPI;

const report = () => {
  const region = document.querySelector('.toast-region');
  if (!region || !api) return;
  const rect = region.getBoundingClientRect();
  api.toastLayout({
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
    count: region.children.length,
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
