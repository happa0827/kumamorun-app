import { useEffect } from "react";
import { closeMini, useView } from "../api";
import { display } from "../display";

/** 枠なし・透過の小さいウィンドウ。残り時間だけを出す。 */
export function Mini() {
  const view = useView();
  useEffect(() => {
    document.body.classList.add("mini-body");
    return () => document.body.classList.remove("mini-body");
  }, []);
  if (!view) return null;
  const { label, remaining } = display(view);
  return (
    <div className="mini-card" data-tauri-drag-region title="ドラッグで移動できます">
      <button className="mini-exit" aria-label="ミニを閉じる" onClick={() => closeMini()}>
        ✕
      </button>
      <span className="mini-label" data-tauri-drag-region>
        {label}
      </span>
      <span className="mini-remaining" data-tauri-drag-region>
        {remaining}
      </span>
    </div>
  );
}
