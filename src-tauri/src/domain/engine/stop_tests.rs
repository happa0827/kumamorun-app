//! やめた確認。昼休憩の開始時と終了時刻に、3分以内に「やめた」を押す。

use chrono::Duration;

use crate::domain::effects::Effect;
use crate::domain::restrictions::{DayRestriction, Restrictions};
use crate::domain::stop_confirm::StopKind;
use crate::domain::timer::TimerKind;

use super::timer_tests::{at, engine, t};
use super::*;

/// 昼休憩の開始（12:00）を通過させる。
fn pass_lunch_start(e: &mut Engine) {
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
}

/// 終了時刻（22:00）を通過させる。
fn pass_end_time(e: &mut Engine) {
    e.tick(at(9, 21, 59, 59));
    e.tick(at(9, 22, 0, 0));
}

#[test]
fn 昼休憩の開始を通過すると確認が始まる() {
    let mut e = engine(at(9, 11, 0, 0));
    assert_eq!(e.stop_prompt(at(9, 11, 59, 59)), None);
    pass_lunch_start(&mut e);
    let prompt = e.stop_prompt(at(9, 12, 0, 0)).unwrap();
    assert_eq!(prompt.kind, StopKind::LunchStart);
    assert_eq!(prompt.left, Duration::minutes(3));
    assert_eq!(
        e.stop_prompt(at(9, 12, 1, 0)).unwrap().left,
        Duration::minutes(2)
    );
}

#[test]
fn 終了時刻を通過しても確認が始まる() {
    let mut e = engine(at(9, 21, 0, 0));
    pass_end_time(&mut e);
    assert_eq!(
        e.stop_prompt(at(9, 22, 0, 0)).unwrap().kind,
        StopKind::EndTime
    );
}

#[test]
fn 昼休憩の終了では確認を始めない() {
    let mut e = engine(at(9, 12, 0, 0));
    e.tick(at(9, 12, 59, 59));
    e.tick(at(9, 13, 0, 0));
    assert_eq!(e.stop_prompt(at(9, 13, 0, 0)), None);
}

#[test]
fn 押すと確認が消え_失敗にならない() {
    let mut e = engine(at(9, 11, 0, 0));
    pass_lunch_start(&mut e);
    e.press_stopped(at(9, 12, 1, 0));
    assert_eq!(e.stop_prompt(at(9, 12, 1, 0)), None);
    e.tick(at(9, 12, 5, 0));
    assert_eq!(e.failures(), 0);
}

#[test]
fn 押さずに3分経つと失敗になり_一度だけ数える() {
    let mut e = engine(at(9, 11, 0, 0));
    pass_lunch_start(&mut e);
    e.tick(at(9, 12, 2, 59));
    assert_eq!(e.failures(), 0);
    assert!(e.stop_prompt(at(9, 12, 2, 59)).is_some());

    e.tick(at(9, 12, 3, 0));
    assert_eq!(e.failures(), 1);
    assert_eq!(e.stop_prompt(at(9, 12, 3, 0)), None);

    e.tick(at(9, 12, 3, 1));
    e.tick(at(9, 12, 10, 0));
    assert_eq!(e.failures(), 1);
}

#[test]
fn 三分ちょうどを過ぎてからでは押せない() {
    let mut e = engine(at(9, 11, 0, 0));
    pass_lunch_start(&mut e);
    assert!(e.press_stopped(at(9, 12, 3, 0)).is_empty());
    e.tick(at(9, 12, 3, 0));
    assert_eq!(e.failures(), 1);
}

#[test]
fn 終了時刻で押すとスリープを要求する() {
    let mut e = engine(at(9, 21, 0, 0));
    pass_end_time(&mut e);
    let effects = e.press_stopped(at(9, 22, 1, 0));
    assert!(effects.contains(&Effect::SleepNow));
}

#[test]
fn 昼休憩で押してもスリープを要求しない() {
    let mut e = engine(at(9, 11, 0, 0));
    pass_lunch_start(&mut e);
    let effects = e.press_stopped(at(9, 12, 1, 0));
    assert!(!effects.contains(&Effect::SleepNow));
}

#[test]
fn 確認がなければ押しても何も起きない() {
    let mut e = engine(at(9, 11, 0, 0));
    assert!(e.press_stopped(at(9, 11, 0, 0)).is_empty());
}

#[test]
fn 二つの確認が重なれば昼休憩を先に出し_押すと次を出す() {
    let mut e = Engine::new(at(9, 11, 0, 0));
    e.set_restrictions(
        Restrictions {
            weekday: DayRestriction {
                lunch_start: Some(t(12, 0)),
                lunch_end: Some(t(13, 0)),
                end_time: Some(t(12, 1)),
            },
            weekend: DayRestriction::default(),
        },
        at(9, 11, 0, 0),
    );
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    e.tick(at(9, 12, 1, 0));

    assert_eq!(
        e.stop_prompt(at(9, 12, 1, 0)).unwrap().kind,
        StopKind::LunchStart
    );
    e.press_stopped(at(9, 12, 1, 5));
    assert_eq!(
        e.stop_prompt(at(9, 12, 1, 5)).unwrap().kind,
        StopKind::EndTime
    );
    e.press_stopped(at(9, 12, 1, 6));
    assert_eq!(e.stop_prompt(at(9, 12, 1, 6)), None);
    e.tick(at(9, 12, 10, 0));
    assert_eq!(e.failures(), 0);
}

#[test]
fn 昼休憩と終了時刻の確認はそれぞれ別に失敗を数える() {
    let mut e = Engine::new(at(9, 11, 0, 0));
    e.set_restrictions(
        Restrictions {
            weekday: DayRestriction {
                lunch_start: Some(t(12, 0)),
                lunch_end: Some(t(13, 0)),
                end_time: Some(t(12, 1)),
            },
            weekend: DayRestriction::default(),
        },
        at(9, 11, 0, 0),
    );
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    e.tick(at(9, 12, 1, 0));
    e.tick(at(9, 12, 10, 0));
    assert_eq!(e.failures(), 2);
}

#[test]
fn スリープ中に通過した境界では確認を始めない() {
    let mut e = engine(at(9, 11, 0, 0));
    e.tick(at(9, 11, 59, 0));
    e.tick(at(9, 12, 30, 0)); // 12:00 を眠って過ごした
    assert_eq!(e.stop_prompt(at(9, 12, 30, 0)), None);
    assert_eq!(e.failures(), 0);
}

#[test]
fn 打ち切られた遊びでも確認が始まる() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 11, 30, 0))
        .unwrap();
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    assert!(e.stop_prompt(at(9, 12, 0, 0)).is_some());
}

// ---- 日付変更 ----

/// その日に遊びを1回完走した状態にする（成功日になる条件）。
fn finish_one_play(e: &mut Engine) {
    e.start_timer(TimerKind::Play, Duration::minutes(1), at(9, 20, 0, 0))
        .unwrap();
    e.tick(at(9, 20, 1, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(1), at(9, 20, 2, 0))
        .unwrap();
}

#[test]
fn アプリが止まっていて逃した確認は日付変更で失敗にする() {
    let mut e = engine(at(9, 20, 0, 0));
    finish_one_play(&mut e);
    pass_end_time(&mut e);
    // 22:00 の確認に応答しないまま、アプリが止まった。翌日の復帰で最初の tick が来る。
    e.tick(at(10, 7, 30, 0));
    assert_eq!(e.pending_evolutions(), 0);
    let week = e.week(at(10, 7, 30, 0));
    assert_eq!(week[5].record.failures, 1);
}

#[test]
fn 押し済みの確認は日付変更で失敗にならない() {
    let mut e = engine(at(9, 20, 0, 0));
    finish_one_play(&mut e);
    pass_end_time(&mut e);
    e.press_stopped(at(9, 22, 1, 0));
    e.tick(at(10, 0, 0, 0));
    assert_eq!(e.pending_evolutions(), 1);
}

#[test]
fn タイムアウトで失敗にした確認は日付変更で二重に数えない() {
    let mut e = engine(at(9, 20, 0, 0));
    finish_one_play(&mut e);
    pass_end_time(&mut e);
    e.tick(at(9, 22, 4, 0)); // 3分を過ぎて失敗
    e.tick(at(10, 0, 0, 0));
    let week = e.week(at(10, 0, 0, 0));
    assert_eq!(week[5].record.failures, 1);
}

#[test]
fn 日付が変わると前日の確認は消える() {
    let mut e = engine(at(9, 21, 0, 0));
    pass_end_time(&mut e);
    e.tick(at(10, 0, 0, 0));
    assert_eq!(e.stop_prompt(at(10, 0, 0, 0)), None);
}
