// Created when this module evaluates, so assistive tech has registered the
// region before content lands in it.

const TOAST_MS = 6000;

const region = mountRegion();

export function showToast(title, body) {
  const { toast, close } = buildToast(title, body);
  let timer = null;
  const hold = () => {
    clearTimeout(timer);
    timer = null;
  };
  const dismiss = () => {
    hold();
    toast.remove();
  };
  const arm = () => {
    hold();
    timer = setTimeout(dismiss, TOAST_MS);
  };
  close.addEventListener('click', dismiss);
  toast.addEventListener('pointerenter', hold);
  toast.addEventListener('pointerleave', arm);
  region.append(toast);
  arm();
}

function mountRegion() {
  const el = document.createElement('div');
  el.className = 'toast-region';
  // role=status implies aria-atomic, which would re-read the whole stack on every add.
  el.setAttribute('aria-live', 'polite');
  document.body.append(el);
  return el;
}

function buildToast(title, body) {
  const toast = document.createElement('div');
  toast.className = 'toast';

  const titleEl = document.createElement('p');
  titleEl.className = 'toast-title';
  titleEl.textContent = title;

  const bodyEl = document.createElement('p');
  bodyEl.className = 'toast-body';
  bodyEl.textContent = body;

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.type = 'button';
  close.setAttribute('aria-label', '閉じる');
  close.textContent = '✕';

  toast.append(titleEl, bodyEl, close);
  return { toast, close };
}
