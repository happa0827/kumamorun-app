//! 再起動（保存と復元）をまたいでも規則が保たれること。
//! アプリが止まっている間も時間は進むので、復帰後の最初の tick で追いつく。

use chrono::Duration;

use crate::domain::effects::{Effect, Notice, Sound};
use crate::domain::stop_confirm::StopKind;
use crate::domain::timer::TimerKind;

use super::timer_tests::{at, engine};
use super::*;

/// 保存して復元する。
fn restart(e: &Engine) -> Engine {
    let json = serde_json::to_string(e).unwrap();
    serde_json::from_str(&json).unwrap()
}

#[test]
fn 保存して復元しても同じ状態() {
    let mut e = engine(at(9, 10, 0, 0));
    e.set_notify20(true);
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 5, 0));
    assert_eq!(restart(&e), e);
}

#[test]
fn 再起動をまたいでタイマーが続く() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 5, 0));
    let mut e = restart(&e);
    assert_eq!(
        e.timer_remaining(at(9, 10, 10, 0)),
        Some(Duration::minutes(20))
    );
    assert_eq!(e.phase(at(9, 10, 10, 0)), Phase::Play);
    e.tick(at(9, 10, 29, 59));
    assert_eq!(e.plays(), 0);
    e.tick(at(9, 10, 30, 0));
    assert_eq!(e.plays(), 1);
}

#[test]
fn 一時停止中の状態も復元される() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.pause(at(9, 10, 10, 0));
    let e = restart(&e);
    assert_eq!(e.phase(at(9, 11, 0, 0)), Phase::Paused);
    assert_eq!(
        e.timer_remaining(at(9, 11, 0, 0)),
        Some(Duration::minutes(20))
    );
}

#[test]
fn 停止中に時間切れになったタイマーは復帰時に完走として処理する() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 5, 0));
    let mut e = restart(&e);
    let effects = e.tick(at(9, 11, 0, 0));
    assert!(effects.contains(&Effect::Notice(Notice::TimerFinished(TimerKind::Play))));
    assert!(effects.contains(&Effect::Sound(Sound::Finish(TimerKind::Play))));
    assert_eq!(e.plays(), 1);
    // 二度目は重複しない。
    assert!(e.tick(at(9, 11, 0, 1)).is_empty());
    assert_eq!(e.plays(), 1);
}

#[test]
fn 休憩の猶予は再起動をまたぐ() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(30), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 30, 0));

    let mut within = restart(&e);
    within
        .start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 32, 0))
        .unwrap();
    assert_eq!(within.failures(), 0);

    let mut late = restart(&e);
    late.start_timer(TimerKind::Break, Duration::minutes(5), at(9, 10, 40, 0))
        .unwrap();
    assert_eq!(late.failures(), 1);
}

#[test]
fn やめた確認は再起動をまたぐ() {
    let mut e = engine(at(9, 11, 0, 0));
    e.tick(at(9, 11, 59, 59));
    e.tick(at(9, 12, 0, 0));

    let mut e1 = restart(&e);
    let prompt = e1.stop_prompt(at(9, 12, 1, 0)).unwrap();
    assert_eq!(prompt.kind, StopKind::LunchStart);
    assert_eq!(prompt.left, Duration::minutes(2));
    e1.press_stopped(at(9, 12, 1, 0));
    e1.tick(at(9, 12, 10, 0));
    assert_eq!(e1.failures(), 0);

    // 窓の間に止まっていて、3分を過ぎてから復帰した。
    let mut e2 = restart(&e);
    e2.tick(at(9, 12, 5, 0));
    assert_eq!(e2.failures(), 1);
}

#[test]
fn 保留した進化は再起動をまたぐ() {
    let mut e = engine(at(9, 10, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(1), at(9, 10, 0, 0))
        .unwrap();
    e.tick(at(9, 10, 1, 0));
    e.tick(at(10, 0, 0, 0));
    assert_eq!(e.pending_evolutions(), 1);
    let mut e = restart(&e);
    assert_eq!(e.pending_evolutions(), 1);
    assert!(e.take_pending_evolution());
}

#[test]
fn 停止中に日付が変わっていれば復帰時に前日を評価する() {
    let mut e = engine(at(9, 20, 0, 0));
    e.start_timer(TimerKind::Play, Duration::minutes(1), at(9, 20, 0, 0))
        .unwrap();
    e.tick(at(9, 20, 1, 0));
    let mut e = restart(&e);
    e.tick(at(10, 8, 0, 0));
    assert_eq!(e.pending_evolutions(), 1);
}

#[test]
fn 停止中に通過した制限時刻は復帰後に鳴らさない() {
    let mut e = engine(at(9, 11, 0, 0));
    e.tick(at(9, 11, 59, 0));
    let mut e = restart(&e);
    let effects = e.tick(at(9, 12, 30, 0));
    assert!(!effects.iter().any(|f| matches!(
        f,
        Effect::Notice(Notice::Boundary { .. }) | Effect::Sound(Sound::Alarm)
    )));
    assert_eq!(e.stop_prompt(at(9, 12, 30, 0)), None);
}

#[test]
fn スタート制限と通知の設定も復元される() {
    let mut e = engine(at(9, 10, 0, 0));
    e.set_notify20(true);
    let mut e = restart(&e);
    assert!(
        e.start_timer(TimerKind::Play, Duration::minutes(10), at(9, 12, 30, 0))
            .is_err()
    );
    e.start_timer(TimerKind::Play, Duration::minutes(60), at(9, 10, 0, 0))
        .unwrap();
    let effects = e.tick(at(9, 10, 20, 0));
    assert!(effects.contains(&Effect::Notice(Notice::EyeBreak)));
}
