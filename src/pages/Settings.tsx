import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Checkbox } from "@/components/arc/checkbox/checkbox";
import { Input } from "@/components/arc/input/input";
import { MorphSelect } from "@/components/arc/morph-select/morph-select";
import { Slider } from "@/components/arc/slider/slider";
import styles from "./Settings.module.css";
import {
  checkUpdate,
  getSettings,
  installUpdate,
  listOutputs,
  saveSettings,
  speakNow,
  testSound,
  type UpdateInfo,
} from "../api";
import { acceleratorFromKey, shortcutLabel } from "../shortcut";
import { parseSeconds, secondsText } from "../forms";
import type { SoundPurpose, Speakers } from "../types";

interface Props {
  onBack: () => void;
}

const NO_SPEAKERS: Speakers = { play: null, rest: null, notify: null, shared: "" };

/** capabilities/default.json の opener:allow-open-url と同じ URL にする。 */
const REPO_URL = "https://github.com/happa0827/kumamorun-app";

type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "latest" }
  | { kind: "found"; info: UpdateInfo }
  | { kind: "installing"; info: UpdateInfo }
  | { kind: "error"; message: string };

/** バージョン、更新の手動確認、GitHub のページへの導線。保存の対象ではない。 */
function AboutSection() {
  const [version, setVersion] = useState<string | null>(null);
  const [update, setUpdate] = useState<UpdateState>({ kind: "idle" });

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(null));
  }, []);

  const check = async () => {
    setUpdate({ kind: "checking" });
    try {
      const info = await checkUpdate();
      setUpdate(info ? { kind: "found", info } : { kind: "latest" });
    } catch (e) {
      setUpdate({ kind: "error", message: String(e) });
    }
  };

  const install = async (info: UpdateInfo) => {
    setUpdate({ kind: "installing", info });
    try {
      await installUpdate();
    } catch (e) {
      setUpdate({ kind: "error", message: String(e) });
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>バージョン情報</h2>
      <p className={styles.hint}>現在のバージョン: {version ? `v${version}` : "取得できません"}</p>

      <div className={styles.row}>
        <Button
          variant="secondary"
          loading={update.kind === "checking"}
          disabled={update.kind === "installing"}
          onClick={check}
        >
          更新を確認
        </Button>
        <Button variant="secondary" onClick={() => openUrl(REPO_URL)}>
          <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
          GitHub を開く
        </Button>
      </div>

      {update.kind === "latest" && (
        <Alert tone="success" title="最新の版です">
          {import.meta.env.DEV
            ? "開発ビルドでは、新しい版の確認はしません。"
            : "更新はありません。"}
        </Alert>
      )}
      {(update.kind === "found" || update.kind === "installing") && (
        <Alert tone="info" title={`新しい版 v${update.info.version} があります`}>
          入れると再起動します。タイマーは止まります。
        </Alert>
      )}
      {(update.kind === "found" || update.kind === "installing") && (
        <Button
          className="accent-button"
          loading={update.kind === "installing"}
          onClick={() => install(update.info)}
        >
          {`v${update.info.version} に更新`}
        </Button>
      )}
      {update.kind === "error" && (
        <Alert tone="danger" title="確認できませんでした">
          {update.message}
        </Alert>
      )}
    </section>
  );
}

const SAME = "same";
const DEFAULT = "default";
const DEVICE = "device:";

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
  const [testing, setTesting] = useState(false);
  // 選ばれている名前が今は見つからなくても、選択肢に残して見えるようにする。
  const missing = value && !outputs.includes(value) ? [value] : [];
  const test = async () => {
    setError(null);
    setTesting(true);
    try {
      await testSound(purpose, value ?? "");
    } catch (e) {
      setError(String(e));
    } finally {
      setTesting(false);
    }
  };

  // Select の項目に空文字は使えないので、「共通と同じ」「既定」「各デバイス」を接頭辞で区別する。
  const options = [
    ...(purpose !== "shared" ? [{ value: SAME, label: "共通の設定と同じ" }] : []),
    { value: DEFAULT, label: "既定のスピーカー" },
    ...[...outputs, ...missing].map((name) => ({ value: DEVICE + name, label: name })),
  ];
  const selected = value === null ? SAME : value === "" ? DEFAULT : DEVICE + value;
  const change = (next: string) =>
    onChange(next === SAME ? null : next === DEFAULT ? "" : next.slice(DEVICE.length));

  return (
    <div className={styles.speaker}>
      <div className={styles.row}>
        <div className={styles.grow}>
          <MorphSelect
            label={label}
            value={selected}
            onValueChange={change}
            items={options}
            searchable={false}
            // 機器名は長いので、開いた一覧を広く・高くして、折り返しやスクロールを避ける。
            panelWidth={560}
            maxListHeight={480}
          />
        </div>
        <Button variant="secondary" loading={testing} onClick={test}>
          テスト再生
        </Button>
      </div>
      {error && (
        <Alert tone="danger" title="再生できませんでした">
          {error}
        </Alert>
      )}
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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
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
      setShortcutError(String(e));
      setSaving(false);
      return;
    }
    onBack();
  };

  return (
    <main className={styles.page}>
      <Button variant="ghost" size="sm" className={styles.back} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        戻る
      </Button>

      <h1 className={styles.title}>設定</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>既定の時間</h2>
        <Input
          label="遊びの時間（秒）"
          type="number"
          inputMode="numeric"
          placeholder="例: 1200"
          value={play}
          onChange={(e) => setPlay(e.target.value)}
        />
        <Input
          label="休憩の時間（秒）"
          type="number"
          inputMode="numeric"
          placeholder="例: 300"
          value={rest}
          onChange={(e) => setRest(e.target.value)}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>目の休憩</h2>
        <Checkbox
          label="20分ごとに目の休憩を知らせる"
          description="20-20-20ルールです"
          checked={notify20}
          onCheckedChange={(next) => setNotify20(next === true)}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>音の出力先</h2>
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
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>残り時間の読み上げ</h2>
        <div className={styles.row}>
          <div className={styles.grow}>
            <Input
              label="読み上げのショートカットキー"
              type="text"
              readOnly
              value={shortcut ? shortcutLabel(shortcut) : ""}
              placeholder={shortcut === "" ? "無効" : "クリックしてキーを押す"}
              onKeyDown={captureShortcut}
            />
          </div>
          <Button variant="secondary" onClick={() => speakNow(volume)}>
            テスト
          </Button>
          <Button variant="secondary" onClick={() => setShortcut("")}>
            無効にする
          </Button>
        </div>
        <Slider
          label="読み上げの音量"
          min={0}
          max={100}
          step={5}
          value={volume}
          onValueChange={setVolume}
          format={(v) => `${v}%`}
        />
        <p className={styles.hint}>
          入力欄をクリックしてから、使いたいキーを押してください（Ctrl / Alt / Shift
          のどれかと、英数字か F1〜F12
          の組み合わせ）。他のアプリで作業中でも、押せば残り時間を読み上げます。
        </p>
        {shortcutError && (
          <Alert tone="warning" title="保存しました。ショートカットは登録できませんでした">
            {shortcutError}
          </Alert>
        )}
      </section>

      <AboutSection />

      <Button
        size="lg"
        className="accent-button"
        loading={saving}
        disabled={!loaded}
        onClick={save}
      >
        保存
      </Button>
    </main>
  );
}
