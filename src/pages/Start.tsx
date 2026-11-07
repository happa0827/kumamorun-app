import { useState } from "react";
import { startTimer } from "../api";
import { parseSeconds } from "../forms";

interface Props {
  onBack: () => void;
  onStarted: () => void;
}

export function Start({ onBack, onStarted }: Props) {
  const [seconds, setSeconds] = useState("");

  // 空欄・不正な値のときは null を渡し、Rust が設定の既定時間を使う。
  const start = async (kind: "play" | "break") => {
    try {
      await startTimer(kind, parseSeconds(seconds));
      onStarted();
    } catch (message) {
      alert(String(message));
    }
  };

  return (
    <div className="app">
      <button className="btn-back" onClick={onBack}>
        ← 戻る
      </button>

      <div className="page-title">
        <h1>スタート</h1>
      </div>

      <div className="field">
        <span className="field-label">時間（秒）— 空欄なら設定の既定値</span>
        <input
          type="number"
          placeholder="例: 1200"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
        />
      </div>

      <div className="actions">
        <button className="btn btn-primary btn-block" onClick={() => start("play")}>
          遊びスタート
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => start("break")}>
          休憩スタート
        </button>
      </div>
    </div>
  );
}
