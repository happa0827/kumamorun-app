//! デモ版の、スタート制限を止めた状態。設定は残し、効き目だけを止める。

use chrono::Duration;

use crate::domain::effects::{Effect, Surface};
use crate::domain::timer::TimerKind;

use super::timer_tests::{at, engine, restrictions};
use super::*;

fn paused(now: NaiveDateTime) -> Engine {
    let mut e = engine(now);
    e.set_restrictions_paused(true, now);
    e
}

#[test]
fn 止めている間は_昼休憩中も終了時刻の後も開始できる() {
    for now in [at(9, 12, 30, 0), at(9, 22, 30, 0)] {
        let mut e = paused(now);
        assert!(
            e.start_timer(TimerKind::Play, Duration::minutes(30), now)
                .is_ok()
        );
        assert_eq!(e.phase(now), Phase::Play);
    }
}

#[test]
fn 止めている間は_境界を過ぎても知らせず_やめた確認も出ない() {
    let mut e = paused(at(9, 11, 59, 59));
    e.tick(at(9, 11, 59, 59));
    let effects = e.tick(at(9, 12, 0, 0));
    assert!(
        !effects.contains(&Effect::Surface(Surface::Alarm)),
        "{effects:?}"
    );
    assert_eq!(e.stop_prompt(at(9, 12, 0, 0)), None);
    assert_ne!(e.phase(at(9, 12, 0, 0)), Phase::Lunch);
}

#[test]
fn 止めている間も_設定した内容は残る() {
    let e = paused(at(9, 10, 0, 0));
    assert_eq!(e.restrictions(), &restrictions());
}

#[test]
fn 止めている間は_サイト向けの状態もスタートできる扱い() {
    let e = paused(at(9, 12, 30, 0));
    let status = e.live_status(at(9, 12, 30, 0), &|_| 0);
    assert!(!status.start_blocked);
    assert_eq!(status.block_reason, None);
}

#[test]
fn 再開しても_すでに過ぎた境界は知らせない() {
    let mut e = paused(at(9, 11, 59, 0));
    e.tick(at(9, 11, 59, 0));
    e.tick(at(9, 12, 0, 1));
    e.set_restrictions_paused(false, at(9, 12, 30, 0));
    let effects = e.tick(at(9, 12, 30, 1));
    assert!(
        !effects.contains(&Effect::Surface(Surface::Alarm)),
        "{effects:?}"
    );
    // 再開したので、昼休憩の制限は効く。
    assert_eq!(e.phase(at(9, 12, 30, 1)), Phase::Lunch);
}

#[test]
fn 止めると_出ているやめた確認は取り消され_失敗に数えない() {
    let mut e = engine(at(9, 21, 59, 59));
    e.tick(at(9, 21, 59, 59));
    e.tick(at(9, 22, 0, 0));
    assert!(e.stop_prompt(at(9, 22, 0, 30)).is_some());
    e.set_restrictions_paused(true, at(9, 22, 0, 30));
    assert_eq!(e.stop_prompt(at(9, 22, 0, 30)), None);
    // 押しても何も起きない（スリープしない）。
    assert_eq!(e.press_stopped(at(9, 22, 1, 0)), vec![]);
    // 窓が尽きても、日をまたいでも、失敗にならない。
    e.tick(at(9, 22, 5, 0));
    assert_eq!(e.failures(), 0);
    e.tick(at(10, 9, 0, 0));
    assert_eq!(e.week(at(10, 9, 0, 0))[5].record.failures, 0);
}

#[test]
fn 止める印は保存しない() {
    let e = paused(at(9, 10, 0, 0));
    let restored: Engine = serde_json::from_str(&serde_json::to_string(&e).unwrap()).unwrap();
    assert!(!restored.restrictions_paused());
}
