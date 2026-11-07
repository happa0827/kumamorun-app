import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import {
  checkUpdate,
  installUpdate,
  openMini,
  pauseTimer,
  pressStopped,
  resumeTimer,
  setFocusMode,
  type UpdateInfo,
} from "../api";
import { display, quitMessage, toggleLabel } from "../display";
import type { Page, View } from "../types";
import { useCloud } from "../cloud/sync";
import { characterImage } from "../growthImage";
import kumaRu from "../assets/kuma-ru.png";

interface Props {
  view: View;
  onNavigate: (page: Page) => void;
}

export function Home({ view, onNavigate }: Props) {
  const { label, remaining } = display(view);
  const toggle = () => (view.timerRunning ? pauseTimer() : resumeTimer());
  const cloud = useCloud();
  const [focus, setFocus] = useState(false);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // 新しい版の確認は、画面を開いたときに1回。入れるのは、利用者が押したときだけ。
  useEffect(() => {
    checkUpdate()
      .then(setUpdate)
      .catch(() => setUpdate(null));
  }, []);

  const install = async () => {
    setUpdating(true);
    setUpdateError(null);
    try {
      await installUpdate();
    } catch (e) {
      setUpdateError(String(e));
      setUpdating(false);
    }
  };

  const openFocus = () => {
    setFocus(true);
    setFocusMode(true);
  };
  const closeFocus = () => {
    setFocus(false);
    setFocusMode(false);
  };

  // Rust が固定を解いたとき（アラームの停止など）にも閉じる。
  useEffect(() => {
    const off = listen("focus-closed", () => setFocus(false));
    return () => {
      off.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  // 「やめた」確認が出たら、集中モードは閉じて確認を見せる。
  useEffect(() => {
    if (view.stopPrompt && focus) closeFocus();
  }, [view.stopPrompt, focus]);

  return (
    <>
      <div className="app app-split">
        <header className="topbar">
          <div className="brand-row">
            <span className="brand">kumamorun</span>
            {update && (
              <button
                className="btn btn-ghost btn-sm"
                disabled={updating}
                title="入れると再起動します。タイマーは止まります"
                onClick={install}
              >
                {updating ? "更新中…" : `新しい版 v${update.version} に更新`}
              </button>
            )}
            {updateError && <span className="hint">{updateError}</span>}
          </div>
        </header>

        <div className="half top-half">
          <div className="top-block top-block-row">
            <div className="stage">
              <img className="avatar" src={characterImage(cloud.evolution, view.bloom)} alt="くまもーるん" />
            </div>

            <div className="top-text">
              <div className="stat-row">
                <div className="stat-item">
                  <span className="tile-label">進化</span>
                  <span className="tile-value">
                    <span>{cloud.evolution ?? "-"}</span>
                    <span className="tile-sub"> / 6</span>
                  </span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="tile-label">
                    <img className="label-icon" src={kumaRu} alt="花" />{" "}
                  </span>
                  <span className="tile-value">
                    <span>{cloud.flowers ?? "-"}</span>
                  </span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="tile-label">😔 失敗</span>
                  <span className="tile-value">
                    <span>{view.daily?.failures ?? 0}</span>
                  </span>
                </div>
              </div>

              <div className="timer-line">
                <span className="tile-label">{label}</span>
                <span className="tile-value tile-value-time">{remaining}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!view.timerActive}
                  onClick={toggle}
                >
                  {toggleLabel(view)}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!view.timerActive}
                  onClick={openFocus}
                >
                  集中
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => openMini()}>
                  ミニ
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="half bottom-half">
          <div className="grid2">
            <button className="tile tile-btn tile-primary" onClick={() => onNavigate("start")}>
              スタート
            </button>
            <button className="tile tile-btn" onClick={() => onNavigate("account")}>
              アカウント
            </button>
            <button className="tile tile-btn" onClick={() => onNavigate("settings")}>
              設定
            </button>
            <button className="tile tile-btn" onClick={() => onNavigate("restrictions")}>
              スタート制限
            </button>
          </div>
        </div>
      </div>

      {focus && (
        <div className="focus-overlay" onClick={closeFocus}>
          <div className="focus-label">{label}</div>
          <div className="focus-remaining">{remaining}</div>
          <button className="focus-exit" onClick={closeFocus}>
            閉じる（Esc）
          </button>
        </div>
      )}

      {view.stopPrompt && (
        <div className="quit-confirm-overlay">
          <p className="quit-confirm-message">{quitMessage(view.stopPrompt)}</p>
          <button
            type="button"
            className="btn btn-primary quit-confirm-btn"
            onClick={() => pressStopped()}
          >
            やめた
          </button>
        </div>
      )}
    </>
  );
}
