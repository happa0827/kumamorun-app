//! 遊びと休憩のタイマー。時刻は引数で受け取る。

use chrono::{Duration, NaiveDateTime};
use serde::{Deserialize, Serialize};

use crate::domain::restrictions::BoundaryKind;

/// 「まもなく終了」を知らせる残り時間。
pub const WARN_BEFORE: Duration = Duration::minutes(5);
/// 20-20-20ルールの間隔。
pub const EYE_BREAK_INTERVAL: Duration = Duration::minutes(20);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TimerKind {
    Play,
    Break,
}

/// 1回の `tick` で起きたこと。
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TickEvents {
    pub eye_break: bool,
    pub warning: bool,
    pub finished: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Timer {
    kind: TimerKind,
    duration: Duration,
    /// 開始時刻。一時停止していた分だけ後ろにずらす（「開始 + 長さ」で残りが出せるように）。
    started_at: NaiveDateTime,
    running: bool,
    end_at: NaiveDateTime,
    /// 一時停止中の残り。
    paused_remaining: Duration,
    warned: bool,
    finished: bool,
    eye_breaks_sent: i64,
    ended_by: Option<BoundaryKind>,
}

/// 残りを、秒単位に切り上げて返す。負にはならない。
fn ceil_secs(left: Duration) -> Duration {
    let millis = left.num_milliseconds().max(0);
    Duration::seconds((millis + 999) / 1000)
}

impl Timer {
    pub fn start(kind: TimerKind, duration: Duration, now: NaiveDateTime) -> Self {
        Self {
            kind,
            duration,
            started_at: now,
            running: true,
            end_at: now + duration,
            paused_remaining: duration,
            warned: false,
            finished: false,
            eye_breaks_sent: 0,
            ended_by: None,
        }
    }

    pub fn kind(&self) -> TimerKind {
        self.kind
    }

    pub fn duration(&self) -> Duration {
        self.duration
    }

    pub fn started_at(&self) -> NaiveDateTime {
        self.started_at
    }

    pub fn is_running(&self) -> bool {
        self.running
    }

    pub fn is_finished(&self) -> bool {
        self.finished
    }

    pub fn ended_by(&self) -> Option<BoundaryKind> {
        self.ended_by
    }

    pub fn remaining(&self, now: NaiveDateTime) -> Duration {
        if self.running {
            ceil_secs(self.end_at - now)
        } else {
            self.paused_remaining.max(Duration::zero())
        }
    }

    pub fn pause(&mut self, now: NaiveDateTime) {
        if !self.running {
            return;
        }
        self.paused_remaining = self.remaining(now);
        self.running = false;
    }

    pub fn resume(&mut self, now: NaiveDateTime) {
        if self.running || self.finished || self.paused_remaining <= Duration::zero() {
            return;
        }
        self.end_at = now + self.paused_remaining;
        self.started_at = now - (self.duration - self.paused_remaining);
        self.running = true;
    }

    /// 稼働中のタイマーを進める。時間切れなら完走として終わらせる。
    /// スリープなどで `tick` が遅れても、次に来た時点で時間切れになっていれば完走する。
    pub fn tick(&mut self, now: NaiveDateTime, notify20: bool) -> TickEvents {
        let mut events = TickEvents::default();
        if !self.running || self.ended_by.is_some() {
            return events;
        }
        let remaining = self.remaining(now);
        let positive = remaining > Duration::zero();

        if notify20 && self.kind == TimerKind::Play && positive {
            let elapsed = self.duration - remaining;
            let marks = elapsed.num_seconds() / EYE_BREAK_INTERVAL.num_seconds();
            if marks > self.eye_breaks_sent {
                self.eye_breaks_sent = marks;
                events.eye_break = true;
            }
        }
        // 5分以下のタイマーは、開始した瞬間に鳴るだけなので知らせない。
        if self.duration > WARN_BEFORE && !self.warned && positive && remaining <= WARN_BEFORE {
            self.warned = true;
            events.warning = true;
        }
        if !positive {
            self.running = false;
            self.finished = true;
            self.paused_remaining = Duration::zero();
            events.finished = true;
        }
        events
    }

    /// 稼働中の遊びを、スタート制限の境界で打ち切る。打ち切ったら `true`。
    pub fn stop_at_boundary(&mut self, kind: BoundaryKind) -> bool {
        if !self.running || self.kind != TimerKind::Play {
            return false;
        }
        self.running = false;
        self.finished = true;
        self.paused_remaining = Duration::zero();
        self.ended_by = Some(kind);
        true
    }
}
