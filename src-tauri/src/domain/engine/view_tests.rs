//! WebView に渡す画面用の状態。liveStatus に、画面だけが使う情報を足したもの。

use chrono::{Duration, NaiveDateTime};

use crate::domain::timer::TimerKind;

use super::timer_tests::{at, engine};
use super::view::View;
use super::*;

fn ms(dt: NaiveDateTime) -> i64 {
    dt.and_utc().timestamp_millis() - 9 * 3600 * 1000
}

fn view(e: &Engine, now: NaiveDateTime) -> View {
    e.view(now, &ms)
}

#[test]
fn 待機では何も動いていない() {
    let e = engine(at(9, 10, 0, 0));
    let v = view(&e, at(9, 10, 0, 0));
    assert_eq!(v.status.phase, "idle");
    assert!(!v.timer_active);
    assert!(!v.timer_running);
    assert_eq!(v.ended_by, None);
    assert_eq!(v.stop_prompt, None);
}

#[test]
fn 稼働中のタイマー() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    let v = view(&e, at(9, 10, 1, 0));
    assert!(v.timer_active);
    assert!(v.timer_running);
}

#[test]
fn 一時停止中はタイマーはあるが動いていない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.pause(at(9, 10, 1, 0));
    let v = view(&e, at(9, 10, 2, 0));
    assert!(v.timer_active);
    assert!(!v.timer_running);
}

#[test]
fn 昼休憩の表示中も裏のタイマーは動いている() {
    let mut e = engine(at(9, 11, 50, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(30), at(9, 11, 50, 0))
        .unwrap();
    let v = view(&e, at(9, 12, 10, 0));
    assert_eq!(v.status.phase, "lunch");
    assert!(v.timer_active);
    assert!(v.timer_running);
}

#[test]
fn 時間切れのタイマーは動いていない扱い() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 5, 0));
    let v = view(&e, at(9, 10, 6, 0));
    assert!(!v.timer_active);
}

#[test]
fn 打ち切られた理由が分かる() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 11, 30, 0))
        .unwrap();
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    assert_eq!(view(&e, at(9, 13, 30, 0)).ended_by, Some("lunchStart"));

    let mut e = engine(at(9, 21, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 21, 30, 0))
        .unwrap();
    e.tick(at(9, 21, 59, 59));
    e.tick(at(9, 22, 0, 0));
    assert_eq!(view(&e, at(9, 22, 30, 0)).ended_by, Some("endTime"));
}

#[test]
fn やめた確認が画面に出る() {
    let mut e = engine(at(9, 11, 0, 0));
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    let prompt = view(&e, at(9, 12, 1, 0)).stop_prompt.unwrap();
    assert_eq!(prompt.kind, "lunchStart");
    assert_eq!(prompt.left_sec, 120);
}

#[test]
fn やめた確認の残りは秒を切り上げる() {
    let mut e = engine(at(9, 21, 0, 0));
    e.tick(at(9, 21, 59, 59));
    e.tick(at(9, 22, 0, 0));
    let half = chrono::NaiveDate::from_ymd_opt(2026, 11, 9)
        .unwrap()
        .and_hms_milli_opt(22, 0, 0, 500)
        .unwrap();
    let prompt = view(&e, half).stop_prompt.unwrap();
    assert_eq!(prompt.kind, "endTime");
    assert_eq!(prompt.left_sec, 180);
}

#[test]
fn 書き出すjsonは平らで_キーはキャメルケース() {
    let mut e = engine(at(9, 11, 0, 0));
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    let value = serde_json::to_value(view(&e, at(9, 12, 1, 0))).unwrap();
    assert_eq!(value["phase"], "lunch");
    assert_eq!(value["timerActive"], false);
    assert_eq!(value["timerRunning"], false);
    assert_eq!(value["endedBy"], serde_json::Value::Null);
    assert_eq!(value["stopPrompt"]["kind"], "lunchStart");
    assert_eq!(value["stopPrompt"]["leftSec"], 120);
    assert_eq!(value["daily"]["plays"], 0);
}

#[test]
fn スタートを断られた理由は文言で返る() {
    let mut e = engine(at(9, 12, 30, 0));
    let err = e
        .start_timer(TimerKind::Play, Duration::minutes(10), at(9, 12, 30, 0))
        .unwrap_err();
    assert_eq!(
        err.message(),
        "平日の昼休憩中（12:00〜13:00）はスタートできません"
    );
    let err = e
        .start_timer(TimerKind::Play, Duration::zero(), at(9, 10, 0, 0))
        .unwrap_err();
    assert_eq!(err.message(), "秒数を入力してください");
}
