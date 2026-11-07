import { useEffect, useState } from "react";
import { getSettings, listOutputs, saveSettings, speakNow, testSound } from "../api";
import { acceleratorFromKey, shortcutLabel } from "../shortcut";
import { parseSeconds, secondsText } from "../forms";
import type { SoundPurpose, Speakers } from "../types";

interface Props {
  onBack: () => void;
}

const NO_SPEAKERS: Speakers = { play: null, rest: null, notify: null, shared: "" };

/** 出力先の選択。`null`（共通と同じ）を選べるのは、共通以外の用途だけ。 */
function SpeakerSelect({
  label,
  purpose,
  value,
  outputs,
  onChange,
}: {
  label: string;
  purpose: SoundPurpose;
  value: string | null;
  outputs: string[];
  onChange: (next: string | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  // 選ばれている名前が今は見つからなくても、選択肢に残して見えるようにする。
  const missing = value && !outputs.includes(value) ? [value] : [];
  const test = async () => {
    setError(null);
    try {
      await testSound(purpose, value ?? "");
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="speaker-row">
        <select
          value={value ?? "\u0000same"}
          onChange={(e) => onChange(e.target.value === "\u0000same" ? null : e.target.value)}
        >
          {purpose !== "shared" && <option value={"\u0000same"}>共通の設定と同じ</option>}
          <option value="">既定のスピーカー</option>
          {[...outputs, ...missing].map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost btn-sm" onClick={test}>
          テスト再生
        </button>
      </div>
      {error && <span className="hint">{error}</span>}
    </div>
  );
}

export function Settings({ onBack }: Props) {
  const [play, setPlay] = useState("");
  const [rest, setRest] = useState("");
  const [notify20, setNotify20] = useState(false);
  const [speakers, setSpeakers] = useState<Speakers>(NO_SPEAKERS);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [shortcut, setShortcut] = useState("");
  const [volume, setVolume] = useState(100);
  const [shortcutError, setShortcutError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const captureShortcut = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const accelerator = acceleratorFromKey(e.nativeEvent);
    if (accelerator) setShortcut(accelerator);
  };

  useEffect(() => {
    getSettings().then((s) => {
      setPlay(secondsText(s.playSecs));
      setRest(secondsText(s.breakSecs));
      setNotify20(s.notify20);
      setSpeakers(s.speakers);
      setShortcut(s.speakShortcut);
      setVolume(s.speakVolume);
      setLoaded(true);
    });
    listOutputs()
      .then(setOutputs)
      .catch(() => setOutputs([]));
  }, []);

  const save = async () => {
    setShortcutError(null);
    try {
      await saveSettings({
        playSecs: parseSeconds(play),
        breakSecs: parseSeconds(rest),
        notify20,
        speakers,
        speakShortcut: shortcut,
        speakVolume: volume,
      });
    } catch (e) {
      // 設定は保存されている。ショートカットだけ登録できなかったので、画面に残して知らせる。
      setShortcutError(`保存しました。ただし、${String(e)}`);
      return;
    }
    onBack();
  };

  return (
    <div className="app">
      <button className="btn-back" onClick={onBack}>
        ← 戻る
      </button>

      <div className="page-title">
        <h1>設定</h1>
      </div>

      <div className="section">
        <span className="section-title">既定の時間</span>
        <div className="field">
          <span className="field-label">遊びの時間（秒）</span>
          <input
            type="number"
            placeholder="例: 1200"
            value={play}
            onChange={(e) => setPlay(e.target.value)}
          />
        </div>
        <div className="field">
          <span className="field-label">休憩の時間（秒）</span>
          <input
            type="number"
            placeholder="例: 300"
            value={rest}
            onChange={(e) => setRest(e.target.value)}
          />
        </div>
      </div>

      <div className="section">
        <span className="section-title">目の休憩</span>
        <label className="check">
          <input
            type="checkbox"
            checked={notify20}
            onChange={(e) => setNotify20(e.target.checked)}
          />
          20分ごとに目の休憩（20-20-20ルール）を知らせる
        </label>
      </div>

      <div className="section">
        <span className="section-title">音の出力先</span>
        <SpeakerSelect
          label="遊びの完走"
          purpose="play"
          value={speakers.play}
          outputs={outputs}
          onChange={(play) => setSpeakers({ ...speakers, play })}
        />
        <SpeakerSelect
          label="休憩の完走"
          purpose="break"
          value={speakers.rest}
          outputs={outputs}
          onChange={(rest) => setSpeakers({ ...speakers, rest })}
        />
        <SpeakerSelect
          label="お知らせ（残り5分・20-20-20ルール）"
          purpose="notify"
          value={speakers.notify}
          outputs={outputs}
          onChange={(notify) => setSpeakers({ ...speakers, notify })}
        />
        <SpeakerSelect
          label="その他（進化・開花・スタート制限）"
          purpose="shared"
          value={speakers.shared}
          outputs={outputs}
          onChange={(shared) => setSpeakers({ ...speakers, shared: shared ?? "" })}
        />
      </div>

      <div className="section">
        <span className="section-title">残り時間の読み上げ</span>
        <div className="field">
          <span className="field-label">読み上げのショートカットキー</span>
          <div className="shortcut-row">
            <input
              type="text"
              readOnly
              value={shortcut ? shortcutLabel(shortcut) : ""}
              placeholder={shortcut === "" ? "無効" : "クリックしてキーを押す"}
              onKeyDown={captureShortcut}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => speakNow(volume)}>
              テスト
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShortcut("")}>
              無効
            </button>
          </div>
        </div>
        <div className="field">
          <span className="field-label">読み上げの音量</span>
          <div className="range-row">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
            <span className="range-value">{volume}%</span>
          </div>
        </div>
        <p className="hint">
          入力欄をクリックしてから、使いたいキーを押してください（Ctrl / Alt / Shift
          のどれかと、英数字か F1〜F12 の組み合わせ）。他のアプリで作業中でも、押せば残り時間を読み上げます。
        </p>
        {shortcutError && <p className="hint">{shortcutError}</p>}
      </div>

      <button className="btn btn-primary btn-block" disabled={!loaded} onClick={save}>
        保存
      </button>
    </div>
  );
}
