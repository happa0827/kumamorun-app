import { listen } from "@tauri-apps/api/event";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toastLayout, toastReady } from "../api";
import { ToastStack, type ToastItem } from "../toastStack";

interface ToastPayload {
  title: string;
  body: string;
}

/** 入場アニメの移動量は枠の位置に含めない。含めると止まったあと下へずれる。 */
function settledBox(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  const match = getComputedStyle(el).transform.match(/^matrix\(([^)]+)\)$/);
  const parts = match ? match[1].split(",").map(Number) : [];
  const dx = parts.length >= 6 ? parts[4] : 0;
  const dy = parts.length >= 6 ? parts[5] : 0;
  return {
    left: box.left - dx,
    top: box.top - dy,
    right: box.right - dx,
    bottom: box.bottom - dy,
  };
}

/** 透過のトースト窓。積み方と消える時間は ToastStack、位置の計算は Rust。 */
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const stack = useRef<ToastStack | null>(null);
  const region = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add("toast-host");
    const toasts = new ToastStack(
      {
        setTimeout: (fn, ms) => window.setTimeout(fn, ms),
        clearTimeout: (handle) => window.clearTimeout(handle as number),
      },
      setItems,
    );
    stack.current = toasts;
    let hovered: number | null = null;
    const offToast = listen<ToastPayload>("toast", (e) =>
      toasts.show(e.payload.title, e.payload.body),
    );
    // カーソルがどのカードの上かは Rust が見て知らせる。
    const offHover = listen<number | null>("toast-hover", (e) => {
      if (hovered !== null) toasts.release(hovered);
      hovered = e.payload;
      if (hovered !== null) toasts.hold(hovered);
    });
    // 受け取る準備ができてから、溜まっていた分を流してもらう。
    Promise.all([offToast, offHover]).then(() => toastReady());
    return () => {
      document.body.classList.remove("toast-host");
      offToast.then((fn) => fn());
      offHover.then((fn) => fn());
    };
  }, []);

  useLayoutEffect(() => {
    const el = region.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const cards = [...el.querySelectorAll<HTMLElement>(".toast")].map((card) => ({
      id: Number(card.dataset.id),
      ...settledBox(card),
    }));
    toastLayout({
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      count: items.length,
      padTop: parseFloat(style.paddingTop) || 0,
      padRight: parseFloat(style.paddingRight) || 0,
      padBottom: parseFloat(style.paddingBottom) || 0,
      padLeft: parseFloat(style.paddingLeft) || 0,
      cardLeft: cards.length ? Math.min(...cards.map((c) => c.left)) : 0,
      cardTop: cards.length ? Math.min(...cards.map((c) => c.top)) : 0,
      cardRight: cards.length ? Math.max(...cards.map((c) => c.right)) : 0,
      cardBottom: cards.length ? Math.max(...cards.map((c) => c.bottom)) : 0,
      cards,
    });
  }, [items]);

  return (
    <div className="toast-region" aria-live="polite" ref={region}>
      {items.map((item) => (
        <div className="toast" key={item.id} data-id={item.id}>
          <p className="toast-title">{item.title}</p>
          <p className="toast-body">{item.body}</p>
          <button
            className="toast-close"
            type="button"
            aria-label="閉じる"
            onClick={() => stack.current?.dismiss(item.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
