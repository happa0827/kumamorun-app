import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { startTimer } from "../api";
import { parseSeconds } from "../forms";
import styles from "./Start.module.css";

interface Props {
  onBack: () => void;
  onStarted: () => void;
}

type Kind = "play" | "break";

export function Start({ onBack, onStarted }: Props) {
  const [seconds, setSeconds] = useState("");
  const [starting, setStarting] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 空欄・不正な値のときは null を渡し、Rust が設定の既定時間を使う。
  const start = async (kind: Kind) => {
    setStarting(kind);
    setError(null);
    try {
      await startTimer(kind, parseSeconds(seconds));
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

        <Input
          label="時間（秒）"
          type="number"
          inputMode="numeric"
          placeholder="例: 1200"
          description="空欄なら、設定の既定値を使います"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
        />

        {error && (
          <Alert tone="danger" title="始められませんでした">
            {error}
          </Alert>
        )}

        <div className={styles.actions}>
          <Button
            size="lg"
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
