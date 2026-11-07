import { useEffect, useState } from "react";
import { getRestrictions } from "../api";
import { saveRestrictionsEverywhere } from "../cloud/sync";
import type { DayForm, RestrictionsForm } from "../types";

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

  return (
    <div className="section">
      <span className="section-title">{title}</span>
      <div className="field">
        <span className="sub-title">昼休憩</span>
        <span className="hint">
          この時間帯はスタートできません（開始・終了どちらか空欄で無効）。
        </span>
        <div className="time-range">
          開始 <input type="time" value={value.lunchStart} onChange={set("lunchStart")} /> ～ 終了{" "}
          <input type="time" value={value.lunchEnd} onChange={set("lunchEnd")} />
        </div>
      </div>
      <div className="field">
        <span className="sub-title">完全終了</span>
        <span className="hint">この時刻を過ぎると翌日までスタートできません（空欄で無効）。</span>
        <div className="time-range">
          時刻 <input type="time" value={value.endTime} onChange={set("endTime")} />
        </div>
      </div>
    </div>
  );
}

export function Restrictions({ onBack }: Props) {
  const [form, setForm] = useState<RestrictionsForm>({ weekday: empty, weekend: empty });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getRestrictions().then((loadedForm) => {
      setForm(loadedForm);
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    await saveRestrictionsEverywhere(form);
    onBack();
  };

  return (
    <div className="app">
      <button className="btn-back" onClick={onBack}>
        ← 戻る
      </button>

      <div className="page-title">
        <h1>スタート制限</h1>
      </div>
      <p className="hint">平日（月〜金）と週末（土・日）で別々に設定できます。</p>

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

      <button className="btn btn-primary btn-block" disabled={!loaded} onClick={save}>
        保存
      </button>
    </div>
  );
}
