import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { DialTimePicker } from "@/components/dial-time-picker/dial-time-picker";
import { startTimer } from "../api";
import { parseSeconds, secondsUntil, timeText } from "../forms";
import styles from "./Start.module.css";

interface Props {
  onBack: () => void;
  onStarted: () => void;
}

type Kind = "play" | "break";
type Mode = "duration" | "until";

export function Start({ onBack, onStarted }: Props) {
  const [mode, setMode] = useState<Mode>("duration");
  const [seconds, setSeconds] = useState("");
  const [until, setUntil] = useState("");
  const [starting, setStarting] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 秒数が空欄・不正なときは null を渡し、Rust が設定の既定時間を使う。
  // 時刻指定はこの回だけの値で、設定の既定値には保存しない。
  const start = async (kind: Kind) => {
    setError(null);
    let duration: number | null;
    if (mode === "until") {
      const now = new Date();
      duration = secondsUntil(until, now);
      if (duration == null) {
        setError("時刻を選んでください");
        return;
      }
      // 今の時刻のままだと翌日まで(約24時間)になってしまうので、始めさせない。
      if (until === timeText(now)) {
        setError("今の時刻のままです。終わる時刻を選び直してください");
        return;
      }
    } else {
      duration = parseSeconds(seconds);
    }
    setStarting(kind);
    try {
      await startTimer(kind, duration);
      onStarted();
    } catch (message) {
      setError(String(message));
      setStarting(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <Button variant="ghost" size="sm" className={styles.back} onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          戻る
        </Button>

        <h1 className={styles.title}>スタート</h1>

        <div className={styles.modes} role="toolbar" aria-label="時間の決め方">
          <Button
            variant={mode === "duration" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={mode === "duration"}
            onClick={() => setMode("duration")}
          >
            秒数で指定
          </Button>
          <Button
            variant={mode === "until" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={mode === "until"}
            onClick={() => {
              setMode("until");
              // まだ選んでいないときは、今の時刻から始める。
              if (until === "") setUntil(timeText(new Date()));
            }}
          >
            時刻まで
          </Button>
        </div>

        {mode === "duration" ? (
          <Input
            label="時間（秒）"
            type="number"
            inputMode="numeric"
            placeholder="例: 1200"
            description="空欄なら、設定の既定値を使います"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
          />
        ) : (
          <DialTimePicker
            label="終わる時刻"
            description="今からこの時刻までの時間で始めます。過ぎている時刻は翌日になります"
            value={until}
            onChange={setUntil}
          />
        )}

        {error && (
          <Alert tone="danger" title="始められませんでした">
            {error}
          </Alert>
        )}

        <div className={styles.actions}>
          <Button
            size="lg"
            className="accent-button"
            loading={starting === "play"}
            disabled={starting === "break"}
            onClick={() => start("play")}
          >
            遊びスタート
          </Button>
          <Button
            variant="secondary"
            size="lg"
            loading={starting === "break"}
            disabled={starting === "play"}
            onClick={() => start("break")}
          >
            休憩スタート
          </Button>
        </div>
      </div>
    </main>
  );
}
