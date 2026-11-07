use super::*;
use crate::domain::timer::TimerKind;

#[test]
fn 初期値は既定時間なし() {
    let s = Settings::default();
    assert_eq!(s.play_secs, None);
    assert_eq!(s.break_secs, None);
}

#[test]
fn 入力があれば入力を使う() {
    let s = Settings::new(Some(1200), Some(300));
    assert_eq!(s.resolve(TimerKind::Play, Some(600)), Some(600));
    assert_eq!(s.resolve(TimerKind::Break, Some(60)), Some(60));
}

#[test]
fn 入力が空か不正なら既定時間を使う() {
    let s = Settings::new(Some(1200), Some(300));
    assert_eq!(s.resolve(TimerKind::Play, None), Some(1200));
    assert_eq!(s.resolve(TimerKind::Play, Some(0)), Some(1200));
    assert_eq!(s.resolve(TimerKind::Break, Some(-5)), Some(300));
}

#[test]
fn 遊びと休憩の既定時間は別々() {
    let s = Settings::new(Some(1200), None);
    assert_eq!(s.resolve(TimerKind::Play, None), Some(1200));
    assert_eq!(s.resolve(TimerKind::Break, None), None);
}

#[test]
fn 既定時間もなければ決められない() {
    let s = Settings::default();
    assert_eq!(s.resolve(TimerKind::Play, None), None);
    assert_eq!(s.resolve(TimerKind::Play, Some(0)), None);
}

#[test]
fn ゼロ以下の既定時間は設定なしとして保存する() {
    let s = Settings::new(Some(0), Some(-1));
    assert_eq!(s, Settings::default());
}

#[test]
fn 出力先は初期値ではどの音も既定のスピーカー() {
    let s = Speakers::default();
    for use_ in [Use::Play, Use::Break, Use::Notify, Use::Shared] {
        assert_eq!(s.device(use_), "");
    }
}

#[test]
fn 種類ごとの出力先が未設定なら共通の設定にならう() {
    let s = Speakers {
        shared: "ヘッドホン".into(),
        ..Speakers::default()
    };
    assert_eq!(s.device(Use::Play), "ヘッドホン");
    assert_eq!(s.device(Use::Break), "ヘッドホン");
    assert_eq!(s.device(Use::Notify), "ヘッドホン");
    assert_eq!(s.device(Use::Shared), "ヘッドホン");
}

#[test]
fn 種類ごとの設定は共通の設定より優先する() {
    let s = Speakers {
        play: Some("スピーカー".into()),
        rest: Some("".into()),
        notify: None,
        shared: "ヘッドホン".into(),
    };
    assert_eq!(s.device(Use::Play), "スピーカー");
    // 空文字は「既定のスピーカー」を選んだという意味で、共通の設定にはならわない。
    assert_eq!(s.device(Use::Break), "");
    assert_eq!(s.device(Use::Notify), "ヘッドホン");
}

#[test]
fn 出力先の保存形式はキーが固定() {
    let s = Settings {
        speakers: Speakers {
            play: Some("A".into()),
            rest: None,
            notify: Some("B".into()),
            shared: "C".into(),
        },
        ..Settings::default()
    };
    let json = serde_json::to_value(&s).unwrap();
    assert_eq!(json["speakers"]["play"], "A");
    assert_eq!(json["speakers"]["rest"], serde_json::Value::Null);
    assert_eq!(json["speakers"]["notify"], "B");
    assert_eq!(json["speakers"]["shared"], "C");
    let back: Settings = serde_json::from_value(json).unwrap();
    assert_eq!(back, s);
}

#[test]
fn 読み上げの初期値はctrl_alt_tで音量100() {
    let s = Settings::default();
    assert_eq!(s.speak_shortcut, "CommandOrControl+Alt+T");
    assert_eq!(s.speak_volume, 100);
}

#[test]
fn 新しい項目が無い古いファイルは_読み上げの初期値で読む() {
    let s: Settings = serde_json::from_str(r#"{"play_secs":600}"#).unwrap();
    assert_eq!(s.play_secs, Some(600));
    assert_eq!(s.speak_shortcut, "CommandOrControl+Alt+T");
    assert_eq!(s.speak_volume, 100);
}

#[test]
fn ショートカットは空文字なら無効として保存できる() {
    let s: Settings = serde_json::from_str(r#"{"speak_shortcut":""}"#).unwrap();
    assert_eq!(s.speak_shortcut, "");
}

#[test]
fn 古いファイルの欠けたキーは初期値で読む() {
    let s: Settings = serde_json::from_str("{}").unwrap();
    assert_eq!(s, Settings::default());
}
