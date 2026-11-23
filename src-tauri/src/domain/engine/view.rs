//! WebView に渡す画面用の状態。liveStatus に、画面だけが使う情報を足したもの。
//! liveStatus と違い、Firebase には書かない（キーを自由に足せる）。

use chrono::{Duration, NaiveDateTime};
use serde::Serialize;

use crate::domain::restrictions::BoundaryKind;
use crate::domain::stop_confirm::StopKind;

use super::live_status::LiveStatus;
use super::{Engine, Phase};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StopPromptView {
    /// `lunchStart` か `endTime`。
    pub kind: &'static str,
    pub left_sec: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct View {
    #[serde(flatten)]
    pub status: LiveStatus,
    /// 時間切れになっていないタイマーがあるか（一時停止中を含む。昼休憩の表示中も数える）。
    pub timer_active: bool,
    pub timer_running: bool,
    /// 打ち切られたなら、その理由。`lunchStart` か `endTime`。
    pub ended_by: Option<&'static str>,
    pub stop_prompt: Option<StopPromptView>,
    /// クラウドへ反映できていない進化の数。
    pub pending_evolutions: u32,
    /// 今日咲いた花のキー。
    pub bloom: Option<&'static str>,
}

fn ceil_secs(left: Duration) -> i64 {
    (left.num_milliseconds().max(0) + 999) / 1000
}

impl Engine {
    pub fn view(&self, now: NaiveDateTime, to_epoch_ms: &dyn Fn(NaiveDateTime) -> i64) -> View {
        let active = self.timer.as_ref().filter(|timer| !timer.is_finished());
        View {
            status: self.live_status(now, to_epoch_ms),
            timer_active: active.is_some(),
            timer_running: active.is_some_and(|timer| timer.is_running()),
            ended_by: match self.phase(now) {
                Phase::Ended(BoundaryKind::LunchStart) => Some("lunchStart"),
                Phase::Ended(BoundaryKind::EndTime) => Some("endTime"),
                _ => None,
            },
            stop_prompt: self.stop_prompt(now).map(|prompt| StopPromptView {
                kind: match prompt.kind {
                    StopKind::LunchStart => "lunchStart",
                    StopKind::EndTime => "endTime",
                },
                left_sec: ceil_secs(prompt.left),
            }),
            pending_evolutions: self.pending_evolutions,
            bloom: self.bloom_today(now).map(|flower| flower.key()),
        }
    }
}
