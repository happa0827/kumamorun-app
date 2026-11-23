//! liveStatus（users/{uid}/liveStatus）の形。status-kumamorun が読むので、
//! キー名と値の意味は固定。ここのテストが外部との約束を表す。

use chrono::{Duration, NaiveDateTime};
use serde_json::json;

use crate::domain::restrictions::{DayRestriction, Restrictions};
use crate::domain::timer::TimerKind;

use super::live_status::LiveStatus;
use super::timer_tests::{at, engine, t};
use super::*;

/// 日本時間（UTC+9）として、エポックからのミリ秒にする。
fn ms(dt: NaiveDateTime) -> i64 {
    dt.and_utc().timestamp_millis() - 9 * 3600 * 1000
}

fn status(e: &Engine, now: NaiveDateTime) -> LiveStatus {
    e.live_status(now, &ms)
}

#[test]
fn 待機() {
    let e = engine(at(9, 10, 0, 0));
    let s = status(&e, at(9, 10, 0, 0));
    assert!(s.app_running);
    assert_eq!(s.phase, "idle");
    assert_eq!(s.label, "");
    assert_eq!(s.remaining_sec, None);
    assert_eq!(s.started_at, None);
    assert_eq!(s.duration, None);
    assert!(!s.running);
    assert!(!s.keeping);
    assert!(!s.start_blocked);
    assert_eq!(s.block_reason, None);
    let daily = s.daily.unwrap();
    assert_eq!(
        (daily.date.as_str(), daily.plays, daily.failures),
        ("2026-11-09", 0, 0)
    );
    let week = s.week.unwrap();
    assert_eq!(week.len(), 7);
    assert_eq!(week[6].date, "2026-11-09");
    assert_eq!(week[0].date, "2026-11-03");
}

#[test]
fn 遊びの稼働中() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    let s = status(&e, at(9, 10, 5, 0));
    assert_eq!(s.phase, "play");
    assert_eq!(s.label, "遊び");
    assert!(s.running);
    assert!(s.keeping);
    assert_eq!(s.remaining_sec, Some(25 * 60));
    assert_eq!(s.started_at, Some(ms(at(9, 10, 0, 0))));
    assert_eq!(s.duration, Some(30 * 60));
}

#[test]
fn 遊びは次の境界の方が近ければ境界までを出す() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 11, 30, 0))
        .unwrap();
    let s = status(&e, at(9, 11, 40, 0));
    assert_eq!(s.label, "遊び（昼休憩まで）");
    assert_eq!(s.remaining_sec, Some(20 * 60));
    // 開始時刻と長さは遊びのまま。
    assert_eq!(s.duration, Some(3600));

    let mut e = engine(at(9, 21, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 21, 30, 0))
        .unwrap();
    let s = status(&e, at(9, 21, 40, 0));
    assert_eq!(s.label, "遊び（終了まで）");
    assert_eq!(s.remaining_sec, Some(20 * 60));
}

#[test]
fn 境界の方が遠ければ遊びの残りを出す() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    let s = status(&e, at(9, 10, 0, 0));
    assert_eq!(s.label, "遊び");
    assert_eq!(s.remaining_sec, Some(30 * 60));
}

#[test]
fn 休憩は境界に置き換えない() {
    let mut e = engine(at(9, 11, 40, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(60), at(9, 11, 40, 0))
        .unwrap();
    let s = status(&e, at(9, 11, 50, 0));
    assert_eq!(s.phase, "break");
    assert_eq!(s.label, "休憩");
    assert_eq!(s.remaining_sec, Some(50 * 60));
}

#[test]
fn 一時停止() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.pause(at(9, 10, 10, 0));
    let s = status(&e, at(9, 10, 40, 0));
    assert_eq!(s.phase, "paused");
    assert_eq!(s.label, "遊び");
    assert!(!s.running);
    assert!(!s.keeping);
    assert_eq!(s.remaining_sec, Some(20 * 60));
}

#[test]
fn 再開すると開始時刻を一時停止した分だけずらす() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.pause(at(9, 10, 10, 0));
    e.resume(at(9, 10, 50, 0));
    let s = status(&e, at(9, 10, 50, 0));
    // サイトは「開始 + 長さ」から毎秒残りを計算するので、残りと一致させる。
    assert_eq!(s.started_at, Some(ms(at(9, 10, 40, 0))));
    assert_eq!(s.remaining_sec, Some(20 * 60));
}

#[test]
fn 昼休憩() {
    let e = engine(at(9, 10, 0, 0));
    let s = status(&e, at(9, 12, 30, 0));
    assert_eq!(s.phase, "lunch");
    assert_eq!(s.label, "昼休憩中（終了まで）");
    assert_eq!(s.remaining_sec, Some(30 * 60));
    assert_eq!(s.started_at, Some(ms(at(9, 12, 0, 0))));
    assert_eq!(s.duration, Some(3600));
    assert!(s.keeping);
    assert!(!s.running);
}

#[test]
fn 休憩の猶予() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 30, 0));
    let s = status(&e, at(9, 10, 31, 0));
    assert_eq!(s.phase, "reward");
    assert_eq!(s.label, "休憩の猶予");
    assert_eq!(s.remaining_sec, Some(120));
    assert_eq!(s.started_at, Some(ms(at(9, 10, 30, 0))));
    assert_eq!(s.duration, Some(180));
    assert!(!s.keeping);
}

#[test]
fn 時間切れ() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 5, 0));
    let s = status(&e, at(9, 10, 6, 0));
    assert_eq!(s.phase, "finished");
    assert_eq!(s.label, "休憩");
    assert_eq!(s.remaining_sec, None);
    assert_eq!(s.started_at, None);
    assert!(!s.keeping);
}

#[test]
fn 時間切れがスタート制限の後なら固定表示を続ける() {
    let mut e = engine(at(9, 21, 58, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 21, 58, 0))
        .unwrap();
    e.tick(at(9, 22, 3, 0));
    let s = status(&e, at(9, 22, 4, 0));
    assert_eq!(s.phase, "finished");
    assert!(s.start_blocked);
    assert!(s.keeping);
}

#[test]
fn 打ち切り() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 11, 30, 0))
        .unwrap();
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    let s = status(&e, at(9, 13, 30, 0));
    assert_eq!(s.phase, "ended");
    assert_eq!(s.label, "遊び");
}

#[test]
fn スタートできない理由() {
    let e = engine(at(9, 10, 0, 0));
    let s = status(&e, at(9, 12, 30, 0));
    assert!(s.start_blocked);
    assert_eq!(
        s.block_reason.as_deref(),
        Some("平日の昼休憩中（12:00〜13:00）はスタートできません")
    );
    let s = status(&e, at(9, 22, 30, 0));
    assert_eq!(
        s.block_reason.as_deref(),
        Some("平日の終了時刻（22:00）を過ぎたため、明日までスタートできません")
    );
}

#[test]
fn 週末は週末と表示する() {
    let mut e = Engine::new(at(7, 10, 0, 0)); // 土曜
    e.set_restrictions(
        Restrictions {
            weekday: DayRestriction::default(),
            weekend: DayRestriction {
                lunch_start: Some(t(13, 0)),
                lunch_end: Some(t(14, 0)),
                end_time: Some(t(23, 0)),
            },
        },
        at(7, 10, 0, 0),
    );
    let s = status(&e, at(7, 13, 30, 0));
    assert_eq!(
        s.block_reason.as_deref(),
        Some("週末の昼休憩中（13:00〜14:00）はスタートできません")
    );
}

#[test]
fn 直近7日の成功日が分かる() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(1), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 1, 0));
    e.tick(at(10, 0, 0, 0));
    let s = status(&e, at(10, 9, 0, 0));
    let week = s.week.unwrap();
    let yesterday = &week[5];
    assert_eq!(yesterday.date, "2026-11-09");
    assert!(yesterday.success);
    assert_eq!((yesterday.plays, yesterday.failures), (1, 0));
    assert!(!week[6].success);
}

#[test]
fn 書き込むキーは固定() {
    let e = engine(at(9, 10, 0, 0));
    let value = serde_json::to_value(status(&e, at(9, 10, 0, 0))).unwrap();
    let mut keys: Vec<_> = value.as_object().unwrap().keys().cloned().collect();
    keys.sort();
    let mut expected = vec![
        "appRunning",
        "blockReason",
        "daily",
        "duration",
        "keeping",
        "label",
        "phase",
        "remainingSec",
        "running",
        "startBlocked",
        "startedAt",
        "week",
    ];
    expected.sort();
    assert_eq!(keys, expected);
    assert_eq!(value["remainingSec"], serde_json::Value::Null);
    assert_eq!(
        value["daily"],
        json!({"date": "2026-11-09", "plays": 0, "failures": 0})
    );
    assert_eq!(
        value["week"][6],
        json!({"date": "2026-11-09", "plays": 0, "failures": 0, "success": false})
    );
}

#[test]
fn オフライン() {
    let value = serde_json::to_value(LiveStatus::offline()).unwrap();
    assert_eq!(
        value,
        json!({
            "appRunning": false,
            "keeping": false,
            "phase": "offline",
            "label": "",
            "remainingSec": null,
            "startedAt": null,
            "duration": null,
            "running": false,
            "startBlocked": false,
            "blockReason": null,
            "daily": null,
            "week": null,
        })
    );
}
