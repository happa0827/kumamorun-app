//! users/{uid}/liveStatus の中身。status-kumamorun が読むので、キー名と値の意味は固定。
//! `updatedAt` は書き込む側（同期層）が付ける。

use chrono::{Duration, NaiveDateTime};
use serde::Serialize;

use crate::domain::restrictions::{BoundaryKind, StartBlock};
use crate::domain::timer::TimerKind;

use super::{Engine, Phase, REWARD_WINDOW};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DailyEntry {
    pub date: String,
    pub plays: u32,
    pub failures: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct WeekEntry {
    pub date: String,
    pub plays: u32,
    pub failures: u32,
    pub success: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveStatus {
    pub app_running: bool,
    pub keeping: bool,
    pub phase: String,
    pub label: String,
    pub remaining_sec: Option<i64>,
    /// エポックからのミリ秒。
    pub started_at: Option<i64>,
    /// 秒。
    pub duration: Option<i64>,
    pub running: bool,
    pub start_blocked: bool,
    pub block_reason: Option<String>,
    pub daily: Option<DailyEntry>,
    pub week: Option<Vec<WeekEntry>>,
}

impl LiveStatus {
    /// アプリが止まった（または終了した）ときの値。
    pub fn offline() -> Self {
        Self {
            app_running: false,
            keeping: false,
            phase: "offline".into(),
            label: String::new(),
            remaining_sec: None,
            started_at: None,
            duration: None,
            running: false,
            start_blocked: false,
            block_reason: None,
            daily: None,
            week: None,
        }
    }
}

fn phase_name(phase: Phase) -> &'static str {
    match phase {
        Phase::Lunch => "lunch",
        Phase::Play => "play",
        Phase::Break => "break",
        Phase::Paused => "paused",
        Phase::Reward => "reward",
        Phase::Finished => "finished",
        Phase::Ended(_) => "ended",
        Phase::Idle => "idle",
    }
}

fn kind_label(kind: TimerKind) -> &'static str {
    match kind {
        TimerKind::Play => "遊び",
        TimerKind::Break => "休憩",
    }
}

pub(super) fn block_reason(block: StartBlock) -> String {
    let label = |weekend: bool| if weekend { "週末" } else { "平日" };
    match block {
        StartBlock::Lunch {
            start,
            end,
            weekend,
        } => format!(
            "{}の昼休憩中（{}〜{}）はスタートできません",
            label(weekend),
            start.format("%H:%M"),
            end.format("%H:%M")
        ),
        StartBlock::AfterEnd { end, weekend } => format!(
            "{}の終了時刻（{}）を過ぎたため、明日までスタートできません",
            label(weekend),
            end.format("%H:%M")
        ),
    }
}

/// 秒の切り上げ。
fn ceil_secs(left: Duration) -> i64 {
    (left.num_milliseconds().max(0) + 999) / 1000
}

impl Engine {
    /// サイト向けの現在状態。表示と同じ優先順位。
    /// `to_epoch_ms` は、端末のローカル時刻をエポックからのミリ秒にする関数。
    pub fn live_status(
        &self,
        now: NaiveDateTime,
        to_epoch_ms: &dyn Fn(NaiveDateTime) -> i64,
    ) -> LiveStatus {
        let block = self.restrictions.start_block(now);
        let start_blocked = block.is_some();
        let phase = self.phase(now);

        let mut status = LiveStatus {
            app_running: true,
            keeping: false,
            phase: phase_name(phase).into(),
            label: String::new(),
            remaining_sec: None,
            started_at: None,
            duration: None,
            running: false,
            start_blocked,
            block_reason: block.map(block_reason),
            daily: Some(DailyEntry {
                date: self.today.format("%Y-%m-%d").to_string(),
                plays: self.record.plays,
                failures: self.record.failures,
            }),
            week: Some(
                self.week(now)
                    .into_iter()
                    .map(|day| WeekEntry {
                        date: day.date.format("%Y-%m-%d").to_string(),
                        plays: day.record.plays,
                        failures: day.record.failures,
                        success: day.record.is_success(),
                    })
                    .collect(),
            ),
        };

        match phase {
            Phase::Lunch => {
                let today = self.restrictions.for_date(now.date());
                status.keeping = true;
                status.label = "昼休憩中（終了まで）".into();
                status.remaining_sec = self.restrictions.lunch_remaining(now).map(ceil_secs);
                if let (Some(start), Some(end)) = (today.lunch_start, today.lunch_end) {
                    status.started_at = Some(to_epoch_ms(now.date().and_time(start)));
                    status.duration = Some((end - start).num_seconds());
                }
            }
            Phase::Play | Phase::Break | Phase::Paused => {
                let timer = self.timer.as_ref().expect("稼働中の状態にはタイマーがある");
                let mut remaining = timer.remaining(now);
                status.label = kind_label(timer.kind()).into();
                status.started_at = Some(to_epoch_ms(timer.started_at()));
                status.duration = Some(timer.duration().num_seconds());
                status.running = timer.is_running();
                status.keeping = timer.is_running();
                if timer.is_running()
                    && timer.kind() == TimerKind::Play
                    && let Some((left, kind)) = self.restrictions.next_boundary(now)
                    && left < remaining
                {
                    remaining = left;
                    let until = match kind {
                        BoundaryKind::LunchStart => "昼休憩",
                        BoundaryKind::EndTime => "終了",
                    };
                    status.label = format!("遊び（{until}まで）");
                }
                status.remaining_sec = Some(remaining.num_seconds());
            }
            Phase::Reward => {
                status.label = "休憩の猶予".into();
                status.remaining_sec = self.reward_remaining(now).map(ceil_secs);
                status.started_at = self.play_finished_at.map(to_epoch_ms);
                status.duration = Some(REWARD_WINDOW.num_seconds());
            }
            Phase::Finished | Phase::Ended(_) => {
                status.keeping = start_blocked;
                if let Some(timer) = self.timer.as_ref() {
                    status.label = kind_label(timer.kind()).into();
                }
            }
            Phase::Idle => {
                status.keeping = start_blocked;
            }
        }
        status
    }
}
