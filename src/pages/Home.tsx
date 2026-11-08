import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { AnimatedCounter } from "@/components/arc/animated-counter/animated-counter";
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
import styles from "./Home.module.css";

/** データの保存先を切り替える日（2026-11-15）の翌日の0時。これを過ぎたら案内を消す。 */
const SHOW_SWITCH_NOTICE = new Date() < new Date(2026, 10, 16);

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
  // 閉じる処理は Rust（固定の解除）への通知を含むので、effect の中で呼ぶ。
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    if (view.stopPrompt && focus) closeFocus();
  }, [view.stopPrompt, focus]);

  const failures = view.daily?.failures ?? 0;

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <span className={styles.brand}>kumamorun</span>
          {update && (
            <Button
              variant="secondary"
              size="sm"
              loading={updating}
              title="入れると再起動します。タイマーは止まります"
              onClick={install}
            >
              {updating ? "更新中" : `v${update.version} に更新`}
            </Button>
          )}
          {updateError && (
            <Alert tone="danger" title="更新できませんでした" className={styles.updateError}>
              {updateError}
            </Alert>
          )}
        </header>

        {SHOW_SWITCH_NOTICE && (
          <Alert tone="info" title="11月15日(日)にデータの保存先を切り替えます">
            それまでに、ログインしたままこのアプリを一度起動しておいてください。進化段階と花の数を、この端末に控えます。念のため、設定の「データの書き出し」でファイルにも残せます。
          </Alert>
        )}

        <section className={styles.hero}>
          <img
            className={styles.avatar}
            src={characterImage(cloud.stage, view.bloom)}
            alt="くまもーるん"
          />

          <div className={styles.info}>
            <div className={styles.stats}>
              <Stat label="進化" value={cloud.stage} context="6段階中" />
              <Stat
                label={
                  <>
                    <img className={styles.flower} src={kumaRu} alt="" />花
                  </>
                }
                value={cloud.flowers}
                context="集めた数"
              />
              <Stat label="失敗" value={failures} context="今日" />
            </div>

            <div className={styles.timer}>
              <span className={styles.timerLabel}>{label}</span>
              <span className={styles.remaining}>{remaining}</span>
              <div className={styles.timerActions}>
                <Button variant="secondary" size="sm" disabled={!view.timerActive} onClick={toggle}>
                  {toggleLabel(view)}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!view.timerActive}
                  onClick={openFocus}
                >
                  集中
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openMini()}>
                  ミニ
                </Button>
              </div>
            </div>
          </div>
        </section>

        <nav className={styles.nav} aria-label="メニュー">
          <Button size="lg" className="accent-button" onClick={() => onNavigate("start")}>
            スタート
          </Button>
          <Button variant="secondary" size="lg" onClick={() => onNavigate("account")}>
            アカウント
          </Button>
          <Button variant="secondary" size="lg" onClick={() => onNavigate("settings")}>
            設定
          </Button>
          <Button variant="secondary" size="lg" onClick={() => onNavigate("restrictions")}>
            スタート制限
          </Button>
        </nav>
      </main>

      {focus && (
        // 画面のどこを押しても閉じる。キーボードでは Esc と「閉じる」ボタンがあるので、
        // 背景そのものは操作の対象にしない（role="presentation"）。
        <div className={styles.overlay} role="presentation" onClick={closeFocus}>
          <section className={styles.focus} aria-label="集中モード">
            <div className={styles.focusLabel}>{label}</div>
            <div className={styles.focusRemaining}>{remaining}</div>
            <Button variant="secondary" className={styles.focusExit} onClick={closeFocus}>
              閉じる（Esc）
            </Button>
          </section>
        </div>
      )}

      {view.stopPrompt && (
        <div className={`${styles.overlay} ${styles.quit}`} role="alertdialog" aria-modal="true">
          <p className={styles.quitMessage}>{quitMessage(view.stopPrompt)}</p>
          <Button size="lg" className="accent-button" onClick={() => pressStopped()}>
            やめた
          </Button>
        </div>
      )}
    </>
  );
}

// クラウドの値は未取得のことがあるので、その間はカウンターを出さずに「-」を見せる。
function Stat({
  label,
  value,
  context,
}: {
  label: ReactNode;
  value: number | null | undefined;
  context: string;
}) {
  // MetricCard のラベルは文字列だけなので、花の画像を出せるよう、同じ見た目を AnimatedCounter で組む。
  return (
    <article className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      {value == null ? (
        <span className={styles.statValue}>-</span>
      ) : (
        <AnimatedCounter value={value} animateOnView />
      )}
      <span className={styles.statContext}>{context}</span>
    </article>
  );
}
