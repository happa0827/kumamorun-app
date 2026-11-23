import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { DialTimePicker } from "@/components/dial-time-picker/dial-time-picker";
import { getRestrictions, saveRestrictions } from "../api";
import { useCloud } from "../cloud/sync";
import type { DayForm, RestrictionsForm } from "../types";
import styles from "./Restrictions.module.css";

interface Props {
  onBack: () => void;
}

const empty: DayForm = { lunchStart: "", lunchEnd: "", endTime: "" };

function DaySection({
  title,
  value,
  onChange,
}: {
  title: string;
  value: DayForm;
  onChange: (next: DayForm) => void;
}) {
  const set = (key: keyof DayForm) => (next: string) => onChange({ ...value, [key]: next });

  // 時刻は分まで自由に決められる。空欄は無効を表すので、「空欄に戻す」を出す。
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>昼休憩</h3>
        <p className={styles.hint}>
          この時間帯はスタートできません。開始と終了のどちらかが空欄なら、無効になります。
        </p>
        <div className={styles.times}>
          <DialTimePicker
            label="開始"
            clearable
            value={value.lunchStart}
            onChange={set("lunchStart")}
          />
          <DialTimePicker
            label="終了"
            clearable
            value={value.lunchEnd}
            onChange={set("lunchEnd")}
          />
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>完全終了</h3>
        <p className={styles.hint}>
          この時刻を過ぎると、翌日までスタートできません。空欄なら無効です。
        </p>
        <div className={styles.times}>
          <DialTimePicker label="時刻" clearable value={value.endTime} onChange={set("endTime")} />
        </div>
      </div>
    </section>
  );
}

export function Restrictions({ onBack }: Props) {
  const cloud = useCloud();

  return (
    <main className={styles.page}>
      <Button variant="ghost" size="sm" className={styles.back} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        戻る
      </Button>

      <h1 className={styles.title}>スタート制限</h1>

      {cloud.edition === "demo" && (
        // デモ版では効かず、変えられない（Rust も保存を断る）。設定済みの内容は残っていて、完全版になると戻る。
        <Alert tone="info" title="スタート制限は完全版の機能です">
          昼休憩と完全終了の時刻に、スタートを止められます。サイトで承認されると使えるようになります。
        </Alert>
      )}
      {cloud.edition === "full" && (
        // 完全版の間だけ置く。デモ版を挟んで完全版になるたびに作り直されるので、
        // 同期で入ったアカウントの設定を読み直し、読み終わるまで保存できない（古い内容で上書きしない）。
        // 版がまだ届いていない間（`null`）は、どちらも出さない。
        <Editor onSaved={onBack} />
      )}
    </main>
  );
}

function Editor({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<RestrictionsForm>({ weekday: empty, weekend: empty });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getRestrictions().then((loadedForm) => {
      if (!alive) return;
      setForm(loadedForm);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveRestrictions(form);
    } catch (e) {
      setError(String(e));
      setSaving(false);
      return;
    }
    onSaved();
  };

  // 読み終わるまでは入力欄を出さない（入力が読み込みの結果で上書きされないため）。
  if (!loaded) return <p className={styles.hint}>読み込んでいます…</p>;

  return (
    <>
      <p className={styles.hint}>平日（月〜金）と週末（土・日）で別々に設定できます。</p>

      <DaySection
        title="平日（月〜金）"
        value={form.weekday}
        onChange={(weekday) => setForm({ ...form, weekday })}
      />
      <DaySection
        title="週末（土・日）"
        value={form.weekend}
        onChange={(weekend) => setForm({ ...form, weekend })}
      />

      {error && (
        <Alert tone="danger" title="保存できませんでした">
          {error}
        </Alert>
      )}

      <Button size="lg" className="accent-button" loading={saving} onClick={save}>
        保存
      </Button>
    </>
  );
}
