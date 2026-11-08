import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { getRestrictions } from "../api";
import { saveRestrictionsEverywhere } from "../cloud/sync";
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
  const set = (key: keyof DayForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  // 時刻は分まで自由に決められる（空欄で無効）ので、Arc の TimePicker（刻み固定）ではなく、
  // type="time" の Input を使う。
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>昼休憩</h3>
        <p className={styles.hint}>
          この時間帯はスタートできません。開始と終了のどちらかが空欄なら、無効になります。
        </p>
        <div className={styles.times}>
          <Input label="開始" type="time" value={value.lunchStart} onChange={set("lunchStart")} />
          <Input label="終了" type="time" value={value.lunchEnd} onChange={set("lunchEnd")} />
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>完全終了</h3>
        <p className={styles.hint}>この時刻を過ぎると、翌日までスタートできません。空欄なら無効です。</p>
        <div className={styles.times}>
          <Input label="時刻" type="time" value={value.endTime} onChange={set("endTime")} />
        </div>
      </div>
    </section>
  );
}

export function Restrictions({ onBack }: Props) {
  const [form, setForm] = useState<RestrictionsForm>({ weekday: empty, weekend: empty });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRestrictions().then((loadedForm) => {
      setForm(loadedForm);
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveRestrictionsEverywhere(form);
    } catch (e) {
      setError(String(e));
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

      <h1 className={styles.title}>スタート制限</h1>
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

      <Button size="lg" loading={saving} disabled={!loaded} onClick={save}>
        保存
      </Button>
    </main>
  );
}
