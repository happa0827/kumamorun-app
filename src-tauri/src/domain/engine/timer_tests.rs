use chrono::{Duration, NaiveDate, NaiveDateTime, NaiveTime};

use crate::domain::effects::{Boundary, Effect, Notice, Sound, Surface};
use crate::domain::restrictions::{BoundaryKind, DayRestriction, Restrictions, StartBlock};
use crate::domain::timer::TimerKind;

use super::*;

// 2026-11-09 は月曜日。
pub(super) fn at(day: u32, h: u32, m: u32, s: u32) -> NaiveDateTime {
    NaiveDate::from_ymd_opt(2026, 11, day)
        .unwrap()
        .and_hms_opt(h, m, s)
        .unwrap()
}

pub(super) fn t(h: u32, m: u32) -> NaiveTime {
    NaiveTime::from_hms_opt(h, m, 0).unwrap()
}

/// 平日: 昼休憩 12:00〜13:00、終了 22:00。
pub(super) fn restrictions() -> Restrictions {
    Restrictions {
        weekday: DayRestriction {
            lunch_start: Some(t(12, 0)),
            lunch_end: Some(t(13, 0)),
            end_time: Some(t(22, 0)),
        },
        weekend: DayRestriction::default(),
    }
}

pub(super) fn engine(now: NaiveDateTime) -> Engine {
    let mut e = Engine::new(now);
    e.set_restrictions(restrictions(), now);
    e
}

fn has(effects: &[Effect], wanted: Effect) -> bool {
    effects.contains(&wanted)
}

// ---- 開始 ----

#[test]
fn 遊びを開始できる() {
    let mut e = engine(at(9, 10, 0, 0));
    let effects = e
        .start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    assert!(has(
        &effects,
        Effect::ReleaseAlwaysOnTop { force: true }
    ));
    assert_eq!(e.phase(at(9, 10, 0, 0)), Phase::Play);
    assert_eq!(
        e.timer_remaining(at(9, 10, 0, 0)),
        Some(Duration::minutes(30))
    );
}

#[test]
fn 昼休憩中は開始できない() {
    let mut e = engine(at(9, 12, 30, 0));
    let result = e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 12, 30, 0));
    assert!(matches!(
        result,
        Err(StartError::Blocked(StartBlock::Lunch { .. }))
    ));
    assert_eq!(e.timer_remaining(at(9, 12, 30, 0)), None);
}

#[test]
fn 終了時刻以降は休憩も開始できない() {
    let mut e = engine(at(9, 22, 30, 0));
    let result = e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 22, 30, 0));
    assert!(matches!(
        result,
        Err(StartError::Blocked(StartBlock::AfterEnd { .. }))
    ));
}

#[test]
fn 長さが0以下なら開始できない() {
    let mut e = engine(at(9, 10, 0, 0));
    assert_eq!(
        e.start_timer(TimerKind::Play, Duration::zero(), at(9, 10, 0, 0)),
        Err(StartError::InvalidDuration)
    );
}

#[test]
fn 開始を断られても休憩の判定は消費されない() {
    let mut e = engine(at(9, 11, 50, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(1), at(9, 11, 50, 0))
        .unwrap();
    e.tick(at(9, 11, 51, 0)); // 完走
    // 昼休憩に入ってから（猶予は過ぎている）休憩を試みても、断られるだけで失敗にはならない。
    let result = e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 12, 10, 0));
    assert!(result.is_err());
    assert_eq!(e.failures(), 0);
}

#[test]
fn 猶予内に休憩を開始すれば失敗にならない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 30, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 32, 0))
        .unwrap();
    assert_eq!(e.failures(), 0);
    assert_eq!(e.phase(at(9, 10, 32, 0)), Phase::Break);
}

#[test]
fn 猶予を過ぎて休憩を開始すると失敗になる() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 30, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 40, 0))
        .unwrap();
    assert_eq!(e.failures(), 1);
}

// ---- 完走 ----

#[test]
fn 遊びの時間切れで完走になり_猶予が始まる() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 25, 0)); // 残り5分の予告
    assert!(e.tick(at(9, 10, 29, 59)).is_empty());

    let effects = e.tick(at(9, 10, 30, 0));
    assert!(has(&effects, Effect::Surface(Surface::Keep)));
    assert!(has(
        &effects,
        Effect::Notice(Notice::TimerFinished(TimerKind::Play))
    ));
    assert!(has(&effects, Effect::Sound(Sound::Finish(TimerKind::Play))));
    assert_eq!(e.plays(), 1);
    assert_eq!(e.phase(at(9, 10, 30, 0)), Phase::Reward);
    assert_eq!(
        e.reward_remaining(at(9, 10, 30, 0)),
        Some(Duration::minutes(3))
    );
}

#[test]
fn 休憩の時間切れは遊び回数に数えない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 0, 0))
        .unwrap();
    let effects = e.tick(at(9, 10, 5, 0));
    assert!(has(
        &effects,
        Effect::Sound(Sound::Finish(TimerKind::Break))
    ));
    assert_eq!(e.plays(), 0);
    assert_eq!(e.phase(at(9, 10, 5, 0)), Phase::Finished);
}

#[test]
fn 昼休憩中に時間切れになったら最前面を固定せず解除する() {
    let mut e = engine(at(9, 11, 50, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(20), at(9, 11, 50, 0))
        .unwrap();
    e.tick(at(9, 12, 0, 0)); // 昼休憩の開始（休憩は打ち切らない）
    let effects = e.tick(at(9, 12, 10, 0));
    assert!(has(&effects, Effect::ReleaseAlwaysOnTop { force: true }));
    assert!(!has(&effects, Effect::Surface(Surface::Keep)));
}

#[test]
fn スリープ中に時間切れになったタイマーは復帰時に完走として処理する() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    // 10:30 に時間切れ。PC は眠っていて、11:00 の復帰後に最初の tick が来る。
    let effects = e.tick(at(9, 11, 0, 0));
    assert!(has(
        &effects,
        Effect::Notice(Notice::TimerFinished(TimerKind::Play))
    ));
    assert_eq!(e.plays(), 1);
    // 猶予は復帰した時刻から数える。
    assert_eq!(
        e.reward_remaining(at(9, 11, 0, 0)),
        Some(Duration::minutes(3))
    );
    // 二度目の tick で重複して完走しない。
    assert!(e.tick(at(9, 11, 0, 1)).is_empty());
    assert_eq!(e.plays(), 1);
}

#[test]
fn 残りは秒を切り上げる() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::seconds(90), at(9, 10, 0, 0))
        .unwrap();
    let half = NaiveDate::from_ymd_opt(2026, 11, 9)
        .unwrap()
        .and_hms_milli_opt(10, 0, 0, 500)
        .unwrap();
    assert_eq!(e.timer_remaining(half), Some(Duration::seconds(90)));
}

// ---- 残り5分の予告 ----

#[test]
fn 残り5分で一度だけ知らせる() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(10), at(9, 10, 0, 0))
        .unwrap();
    assert!(e.tick(at(9, 10, 4, 59)).is_empty());

    let effects = e.tick(at(9, 10, 5, 0));
    assert!(has(
        &effects,
        Effect::Notice(Notice::TimerWarning {
            kind: TimerKind::Play,
            minutes: 5
        })
    ));
    assert!(has(&effects, Effect::Sound(Sound::Warning)));
    assert!(e.tick(at(9, 10, 5, 1)).is_empty());
}

#[test]
fn 五分以下のタイマーは予告しない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 0, 0))
        .unwrap();
    assert!(e.tick(at(9, 10, 0, 1)).is_empty());
    assert!(e.tick(at(9, 10, 2, 0)).is_empty());
}

// ---- 20-20-20 ----

#[test]
fn 設定がオンなら遊びの20分ごとに目の休憩を知らせる() {
    let mut e = engine(at(9, 10, 0, 0));
    e.set_notify20(true);
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 10, 0, 0))
        .unwrap();
    assert!(e.tick(at(9, 10, 19, 59)).is_empty());

    let effects = e.tick(at(9, 10, 20, 0));
    assert!(has(&effects, Effect::Notice(Notice::EyeBreak)));
    assert!(has(&effects, Effect::Sound(Sound::EyeBreak)));
    assert!(!e.tick(at(9, 10, 20, 1)).iter().any(|f| matches!(f, Effect::Notice(Notice::EyeBreak))));

    let effects = e.tick(at(9, 10, 40, 0));
    assert!(has(&effects, Effect::Notice(Notice::EyeBreak)));
}

#[test]
fn 終了と重なる回の目の休憩は知らせない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.set_notify20(true);
    e.start_timer(TimerKind::Play, Duration::minutes(40), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 20, 0));
    let effects = e.tick(at(9, 10, 40, 0));
    assert!(!has(&effects, Effect::Notice(Notice::EyeBreak)));
}

#[test]
fn 設定がオフなら目の休憩を知らせない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 10, 0, 0))
        .unwrap();
    assert!(!has(
        &e.tick(at(9, 10, 20, 0)),
        Effect::Notice(Notice::EyeBreak)
    ));
}

#[test]
fn 休憩では目の休憩を知らせない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.set_notify20(true);
    e.start_timer(TimerKind::Break, Duration::minutes(60), at(9, 10, 0, 0))
        .unwrap();
    assert!(!has(
        &e.tick(at(9, 10, 20, 0)),
        Effect::Notice(Notice::EyeBreak)
    ));
}

// ---- 一時停止と再開 ----

#[test]
fn 一時停止中は時間が進まず_時間切れにもならない() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.pause(at(9, 10, 10, 0));
    assert_eq!(e.phase(at(9, 10, 10, 0)), Phase::Paused);
    assert_eq!(
        e.timer_remaining(at(9, 11, 0, 0)),
        Some(Duration::minutes(20))
    );
    assert!(e.tick(at(9, 11, 0, 0)).is_empty());
    assert_eq!(e.plays(), 0);
}

#[test]
fn 再開すると残りから終了時刻を計算し直す() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.pause(at(9, 10, 10, 0));
    e.resume(at(9, 10, 50, 0));
    assert_eq!(e.phase(at(9, 10, 50, 0)), Phase::Play);
    assert_eq!(
        e.timer_remaining(at(9, 10, 50, 0)),
        Some(Duration::minutes(20))
    );
    e.tick(at(9, 11, 5, 0)); // 残り5分の予告
    assert!(e.tick(at(9, 11, 9, 59)).is_empty());
    assert!(!e.tick(at(9, 11, 10, 0)).is_empty());
    assert_eq!(e.plays(), 1);
}

#[test]
fn 再開した後も残り5分の予告は一度だけ() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(10), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 5, 0));
    e.pause(at(9, 10, 6, 0));
    e.resume(at(9, 10, 7, 0));
    assert!(!has(&e.tick(at(9, 10, 8, 0)), Effect::Sound(Sound::Warning)));
}

// ---- スタート制限の境界 ----

#[test]
fn 遊び中に昼休憩の時刻に達すると打ち切られ_完走にならない() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 11, 30, 0))
        .unwrap();
    e.tick(at(9, 11, 59, 59));
    let effects = e.tick(at(9, 12, 0, 0));
    assert!(has(&effects, Effect::Surface(Surface::Alarm)));
    assert!(has(
        &effects,
        Effect::Notice(Notice::Boundary {
            boundary: Boundary::LunchStart,
            stopped_play: true
        })
    ));
    assert!(has(&effects, Effect::Sound(Sound::Alarm)));
    assert_eq!(e.plays(), 0);
    assert_eq!(e.reward_remaining(at(9, 12, 0, 0)), None);
    assert_eq!(e.phase(at(9, 12, 0, 1)), Phase::Lunch);
}

#[test]
fn 打ち切られた遊びは昼休憩が終われば打ち切りとして表示される() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 11, 30, 0))
        .unwrap();
    e.tick(at(9, 12, 0, 0));
    assert_eq!(
        e.phase(at(9, 13, 30, 0)),
        Phase::Ended(BoundaryKind::LunchStart)
    );
}

#[test]
fn 遊び中に終了時刻に達すると打ち切られる() {
    let mut e = engine(at(9, 21, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 21, 30, 0))
        .unwrap();
    e.tick(at(9, 21, 59, 59));
    let effects = e.tick(at(9, 22, 0, 0));
    assert!(has(
        &effects,
        Effect::Notice(Notice::Boundary {
            boundary: Boundary::EndTime,
            stopped_play: true
        })
    ));
    assert_eq!(e.phase(at(9, 22, 1, 0)), Phase::Ended(BoundaryKind::EndTime));
    assert_eq!(e.plays(), 0);
}

#[test]
fn 一時停止中の遊びは境界で打ち切られない() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 11, 30, 0))
        .unwrap();
    e.pause(at(9, 11, 40, 0));
    let effects = e.tick(at(9, 12, 0, 0));
    assert!(has(
        &effects,
        Effect::Notice(Notice::Boundary {
            boundary: Boundary::LunchStart,
            stopped_play: false
        })
    ));
    assert_eq!(e.phase(at(9, 13, 30, 0)), Phase::Paused);
}

#[test]
fn 休憩は境界で打ち切られない() {
    let mut e = engine(at(9, 11, 50, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(30), at(9, 11, 50, 0))
        .unwrap();
    let effects = e.tick(at(9, 12, 0, 0));
    assert!(has(
        &effects,
        Effect::Notice(Notice::Boundary {
            boundary: Boundary::LunchStart,
            stopped_play: false
        })
    ));
    assert_eq!(e.phase(at(9, 13, 30, 0)), Phase::Break);
}

#[test]
fn 遊びの完走と境界が同じ秒なら完走を優先する() {
    let mut e = engine(at(9, 11, 30, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 11, 30, 0))
        .unwrap();
    e.tick(at(9, 11, 59, 59));
    let effects = e.tick(at(9, 12, 0, 0));
    assert!(has(
        &effects,
        Effect::Notice(Notice::TimerFinished(TimerKind::Play))
    ));
    assert_eq!(e.plays(), 1);
}

#[test]
fn 境界の知らせは一日に一度だけ() {
    let mut e = engine(at(9, 11, 59, 0));
    e.tick(at(9, 11, 59, 59));
    assert!(!e.tick(at(9, 12, 0, 0)).is_empty());
    assert!(e.tick(at(9, 12, 0, 1)).is_empty());
}

#[test]
fn 昼休憩の終了も知らせる() {
    let mut e = engine(at(9, 12, 59, 0));
    e.tick(at(9, 12, 59, 59));
    let effects = e.tick(at(9, 13, 0, 0));
    assert!(has(
        &effects,
        Effect::Notice(Notice::Boundary {
            boundary: Boundary::LunchEnd,
            stopped_play: false
        })
    ));
    assert!(has(&effects, Effect::Sound(Sound::Alarm)));
}

#[test]
fn スリープ中に通過した制限時刻は復帰後に鳴らさない() {
    let mut e = engine(at(9, 11, 0, 0));
    e.tick(at(9, 11, 59, 58));
    // 12:00 を眠って過ごし、12:30 に復帰した。
    let effects = e.tick(at(9, 12, 30, 0));
    assert!(!effects
        .iter()
        .any(|f| matches!(f, Effect::Notice(Notice::Boundary { .. }) | Effect::Sound(Sound::Alarm))));
}

#[test]
fn アラームが鳴り終わったら最前面を解除する() {
    let mut e = engine(at(9, 21, 59, 0));
    e.tick(at(9, 21, 59, 59));
    e.tick(at(9, 22, 0, 0));
    assert_eq!(
        e.alarm_finished(at(9, 22, 0, 10)),
        vec![Effect::ReleaseAlwaysOnTop { force: false }]
    );
}

#[test]
fn 昼休憩の開始のアラームが鳴り終わったら閉じられるようにする() {
    let mut e = engine(at(9, 11, 59, 0));
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));
    assert_eq!(
        e.alarm_finished(at(9, 12, 0, 10)),
        vec![
            Effect::ReleaseAlwaysOnTop { force: false },
            Effect::ReleaseAlwaysOnTop { force: true },
        ]
    );
}

#[test]
fn 昼休憩の最中に起動したら一度だけ閉じられるようにする() {
    let mut e = engine(at(9, 12, 30, 0));
    let first = e.tick(at(9, 12, 30, 0));
    assert!(has(&first, Effect::ReleaseAlwaysOnTop { force: true }));
    assert!(e.tick(at(9, 12, 30, 1)).is_empty());
}

// ---- 表示の優先順位 ----

#[test]
fn 昼休憩中はタイマーが動いていても昼休憩を表示する() {
    let mut e = engine(at(9, 11, 50, 0));
    e.start_timer(TimerKind::Break, Duration::minutes(30), at(9, 11, 50, 0))
        .unwrap();
    assert_eq!(e.phase(at(9, 12, 10, 0)), Phase::Lunch);
}

#[test]
fn 何もなければ待機() {
    let e = engine(at(9, 10, 0, 0));
    assert_eq!(e.phase(at(9, 10, 0, 0)), Phase::Idle);
}

// ---- 日付変更 ----

#[test]
fn 零時の最初のtickで日付変更を評価する() {
    let mut e = engine(at(9, 21, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(1), at(9, 21, 0, 0))
        .unwrap();
    e.tick(at(9, 21, 1, 0));
    assert_eq!(e.pending_evolutions(), 0);
    e.tick(at(10, 0, 0, 0));
    assert_eq!(e.pending_evolutions(), 1);
}

#[test]
fn スリープ復帰の最初のtickで日付変更を評価する() {
    let mut e = engine(at(9, 21, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(1), at(9, 21, 0, 0))
        .unwrap();
    e.tick(at(9, 21, 1, 0));
    e.tick(at(10, 7, 30, 0)); // 翌朝の復帰
    assert_eq!(e.pending_evolutions(), 1);
    assert_eq!(e.plays(), 0);
}
