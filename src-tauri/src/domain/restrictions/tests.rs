use chrono::{Duration, NaiveDate, NaiveDateTime, NaiveTime};

use super::*;

// 2026-11-06 金, 07 土, 08 日, 09 月。
fn at(day: u32, h: u32, m: u32, s: u32) -> NaiveDateTime {
    NaiveDate::from_ymd_opt(2026, 11, day)
        .unwrap()
        .and_hms_opt(h, m, s)
        .unwrap()
}

fn t(h: u32, m: u32) -> NaiveTime {
    NaiveTime::from_hms_opt(h, m, 0).unwrap()
}

fn day(lunch: Option<((u32, u32), (u32, u32))>, end: Option<(u32, u32)>) -> DayRestriction {
    DayRestriction {
        lunch_start: lunch.map(|(s, _)| t(s.0, s.1)),
        lunch_end: lunch.map(|(_, e)| t(e.0, e.1)),
        end_time: end.map(|(h, m)| t(h, m)),
    }
}

/// 平日: 昼休憩 12:00〜13:00、終了 22:00。週末: 昼休憩 13:00〜14:00、終了 23:00。
fn sample() -> Restrictions {
    Restrictions {
        weekday: day(Some(((12, 0), (13, 0))), Some((22, 0))),
        weekend: day(Some(((13, 0), (14, 0))), Some((23, 0))),
    }
}

// ---- 平日と週末 ----

#[test]
fn 土日は週末_月から金は平日() {
    let r = sample();
    assert_eq!(r.for_date(at(6, 0, 0, 0).date()), &r.weekday); // 金
    assert_eq!(r.for_date(at(7, 0, 0, 0).date()), &r.weekend); // 土
    assert_eq!(r.for_date(at(8, 0, 0, 0).date()), &r.weekend); // 日
    assert_eq!(r.for_date(at(9, 0, 0, 0).date()), &r.weekday); // 月
}

// ---- スタートの可否 ----

#[test]
fn 昼休憩中はスタートできない() {
    let r = sample();
    assert!(matches!(
        r.start_block(at(9, 12, 30, 0)),
        Some(StartBlock::Lunch { weekend: false, .. })
    ));
}

#[test]
fn 昼休憩の開始ちょうどは不可で_終了ちょうどは可() {
    let r = sample();
    assert!(r.start_block(at(9, 12, 0, 0)).is_some());
    assert!(r.start_block(at(9, 11, 59, 59)).is_none());
    assert!(r.start_block(at(9, 12, 59, 59)).is_some());
    assert!(r.start_block(at(9, 13, 0, 0)).is_none());
}

#[test]
fn 終了時刻以降は翌日までスタートできない() {
    let r = sample();
    assert!(r.start_block(at(9, 21, 59, 59)).is_none());
    assert!(matches!(
        r.start_block(at(9, 22, 0, 0)),
        Some(StartBlock::AfterEnd { weekend: false, .. })
    ));
    assert!(r.start_block(at(9, 23, 59, 59)).is_some());
    // 日付が変われば解除される
    assert!(r.start_block(at(10, 0, 0, 0)).is_none());
}

#[test]
fn 週末は週末の設定で判定する() {
    let r = sample();
    // 平日なら昼休憩中の 12:30 も、土曜は対象外。
    assert!(r.start_block(at(7, 12, 30, 0)).is_none());
    assert!(matches!(
        r.start_block(at(7, 13, 30, 0)),
        Some(StartBlock::Lunch { weekend: true, .. })
    ));
    // 平日なら終了後の 22:30 も、土曜は対象外。
    assert!(r.start_block(at(7, 22, 30, 0)).is_none());
}

#[test]
fn 設定がなければスタートを止めない() {
    let r = Restrictions::default();
    assert!(r.start_block(at(9, 12, 30, 0)).is_none());
    assert!(r.start_block(at(9, 23, 0, 0)).is_none());
}

#[test]
fn 昼休憩の片方だけの設定は無効() {
    let r = Restrictions {
        weekday: DayRestriction {
            lunch_start: Some(t(12, 0)),
            lunch_end: None,
            end_time: None,
        },
        weekend: DayRestriction::default(),
    };
    assert!(r.start_block(at(9, 12, 30, 0)).is_none());
}

#[test]
fn 昼休憩と終了時刻が重なれば昼休憩を優先する() {
    let r = Restrictions {
        weekday: day(Some(((12, 0), (13, 0))), Some((12, 30))),
        weekend: DayRestriction::default(),
    };
    assert!(matches!(
        r.start_block(at(9, 12, 45, 0)),
        Some(StartBlock::Lunch { .. })
    ));
}

// ---- 昼休憩の残り ----

#[test]
fn 昼休憩中は終了までの残りを返す() {
    let r = sample();
    assert_eq!(
        r.lunch_remaining(at(9, 12, 30, 0)),
        Some(Duration::minutes(30))
    );
    assert_eq!(
        r.lunch_remaining(at(9, 12, 59, 30)),
        Some(Duration::seconds(30))
    );
    assert_eq!(r.lunch_remaining(at(9, 13, 0, 0)), None);
    assert_eq!(r.lunch_remaining(at(9, 11, 0, 0)), None);
}

// ---- 次の境界 ----

#[test]
fn 次の境界は昼休憩の開始と終了時刻のうち近い方() {
    let r = sample();
    assert_eq!(
        r.next_boundary(at(9, 11, 0, 0)),
        Some((Duration::hours(1), BoundaryKind::LunchStart))
    );
    // 昼休憩の終了は境界に含めない。
    assert_eq!(
        r.next_boundary(at(9, 13, 0, 0)),
        Some((Duration::hours(9), BoundaryKind::EndTime))
    );
}

#[test]
fn 境界を過ぎていれば次の境界はない() {
    let r = sample();
    assert_eq!(r.next_boundary(at(9, 22, 0, 0)), None);
    assert_eq!(r.next_boundary(at(9, 23, 0, 0)), None);
}

#[test]
fn 境界ちょうどは次の境界に数えない() {
    let r = sample();
    assert_eq!(
        r.next_boundary(at(9, 12, 0, 0)),
        Some((Duration::hours(10), BoundaryKind::EndTime))
    );
}

#[test]
fn 次の境界の秒数は切り捨てる() {
    let r = sample();
    let (left, _) = r.next_boundary(at(9, 11, 59, 30)).unwrap();
    assert_eq!(left, Duration::seconds(30));
}

// ---- 通過の検出 ----

#[test]
fn 毎秒の監視で境界の通過を一度だけ検出する() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(9, 11, 59, 58));
    assert_eq!(w.passed(&r, at(9, 11, 59, 59)), Passed::default());
    let p = w.passed(&r, at(9, 12, 0, 0));
    assert!(p.lunch_start);
    assert!(!p.lunch_end && !p.end_time);
    assert_eq!(w.passed(&r, at(9, 12, 0, 1)), Passed::default());
}

#[test]
fn 取りこぼした秒をまたいでも境界を検出する() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(9, 11, 59, 57));
    // 12:00:00 の監視が遅れて 12:00:02 に来ても拾う。
    assert!(w.passed(&r, at(9, 12, 0, 2)).lunch_start);
}

#[test]
fn 昼休憩の終了と終了時刻も検出する() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(9, 12, 59, 59));
    assert!(w.passed(&r, at(9, 13, 0, 0)).lunch_end);
    w.passed(&r, at(9, 21, 59, 59));
    assert!(w.passed(&r, at(9, 22, 0, 0)).end_time);
}

#[test]
fn 前回の監視から60秒以上空いたら過去の境界は鳴らさない() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(9, 11, 58, 0));
    // スリープから復帰。12:00 は復帰の 5 分前に通過している。
    assert_eq!(w.passed(&r, at(9, 12, 5, 0)), Passed::default());
}

#[test]
fn 前回の監視から60秒未満なら通過を拾う() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(9, 11, 59, 10));
    assert!(w.passed(&r, at(9, 12, 0, 5)).lunch_start);
}

#[test]
fn 復帰の直前2秒以内の境界は拾う() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(9, 11, 0, 0));
    assert!(w.passed(&r, at(9, 12, 0, 1)).lunch_start);
}

#[test]
fn 初回の監視は直前2秒だけを見る() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    assert!(w.passed(&r, at(9, 12, 0, 1)).lunch_start);

    let mut w = BoundaryWatcher::default();
    assert_eq!(w.passed(&r, at(9, 12, 0, 3)), Passed::default());
}

#[test]
fn 設定を保存しただけでは通過とみなさない() {
    let mut r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(9, 11, 59, 59));
    // 12:00:00 の直前に、昼休憩の開始を 12:00 に書き換えて保存した。
    r.weekday.lunch_start = Some(t(11, 59));
    w.reset(at(9, 12, 0, 0));
    assert_eq!(w.passed(&r, at(9, 12, 0, 1)), Passed::default());
}

#[test]
fn 週末は週末の設定の境界を検出する() {
    let r = sample();
    let mut w = BoundaryWatcher::default();
    w.passed(&r, at(7, 11, 59, 59));
    // 土曜の 12:00 は何もない。
    assert_eq!(w.passed(&r, at(7, 12, 0, 0)), Passed::default());
    w.passed(&r, at(7, 12, 59, 59));
    assert!(w.passed(&r, at(7, 13, 0, 0)).lunch_start);
}

// ---- HH:MM の読み込み ----

#[test]
fn hhmm_を読み込む() {
    assert_eq!(parse_hhmm("12:05"), Some(t(12, 5)));
    assert_eq!(parse_hhmm("09:00:30"), Some(t(9, 0))); // input type=time の秒付き
    assert_eq!(parse_hhmm(""), None);
    assert_eq!(parse_hhmm("abc"), None);
    assert_eq!(parse_hhmm("25:00"), None);
}

// ---- フォーム型（Firebase の users/{uid}/restrictions と同じ形） ----

fn form(lunch_start: &str, lunch_end: &str, end_time: &str) -> DayForm {
    DayForm {
        lunch_start: lunch_start.into(),
        lunch_end: lunch_end.into(),
        end_time: end_time.into(),
    }
}

#[test]
fn 空のフォームは設定なしになる() {
    let r: Restrictions = (&RestrictionsForm::default()).into();
    assert_eq!(r, Restrictions::default());
}

#[test]
fn フォームから設定に変換する() {
    let f = RestrictionsForm {
        weekday: form("12:00", "13:00", "22:00"),
        weekend: form("", "", "23:30"),
    };
    let r: Restrictions = (&f).into();
    assert_eq!(r.weekday, day(Some(((12, 0), (13, 0))), Some((22, 0))));
    assert_eq!(r.weekend, day(None, Some((23, 30))));
}

#[test]
fn input_type_time_の秒つきも読める() {
    let f = RestrictionsForm {
        weekday: form("12:00:30", "13:00", ""),
        weekend: DayForm::default(),
    };
    let r: Restrictions = (&f).into();
    assert_eq!(r.weekday.lunch_start, Some(t(12, 0)));
}

#[test]
fn 不正な時刻は設定なしとして扱う() {
    let f = RestrictionsForm {
        weekday: form("25:00", "abc", "99:99"),
        weekend: DayForm::default(),
    };
    let r: Restrictions = (&f).into();
    assert_eq!(r.weekday, DayRestriction::default());
}

#[test]
fn 設定からフォームに戻すとゼロ埋めのhhmm() {
    let r = Restrictions {
        weekday: day(Some(((9, 5), (13, 0))), Some((22, 0))),
        weekend: DayRestriction::default(),
    };
    let f: RestrictionsForm = (&r).into();
    assert_eq!(f.weekday, form("09:05", "13:00", "22:00"));
    assert_eq!(f.weekend, DayForm::default());
}

#[test]
fn フォームのjsonのキーは固定() {
    let f = RestrictionsForm {
        weekday: form("12:00", "13:00", "22:00"),
        weekend: DayForm::default(),
    };
    let value = serde_json::to_value(&f).unwrap();
    assert_eq!(
        value,
        serde_json::json!({
            "weekday": {"lunchStart": "12:00", "lunchEnd": "13:00", "endTime": "22:00"},
            "weekend": {"lunchStart": "", "lunchEnd": "", "endTime": ""},
        })
    );
}

#[test]
fn 欠けたキーは空として読める() {
    let f: RestrictionsForm =
        serde_json::from_str(r#"{"weekday":{"lunchStart":"12:00"}}"#).unwrap();
    assert_eq!(f.weekday, form("12:00", "", ""));
    assert_eq!(f.weekend, DayForm::default());
    let f: RestrictionsForm = serde_json::from_str("{}").unwrap();
    assert_eq!(f, RestrictionsForm::default());
}
