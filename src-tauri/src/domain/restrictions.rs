//! スタート制限。昼休憩の時間帯と終了時刻。平日と週末で別々に持つ。

use chrono::{Duration, NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct DayRestriction {
    pub lunch_start: Option<NaiveTime>,
    pub lunch_end: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Restrictions {
    pub weekday: DayRestriction,
    pub weekend: DayRestriction,
}

/// 画面と Firebase（users/{uid}/restrictions）で使う形。時刻は "HH:MM"、未設定は ""。
/// キー名は status-kumamorun などの外部が読むので固定。
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct DayForm {
    pub lunch_start: String,
    pub lunch_end: String,
    pub end_time: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct RestrictionsForm {
    pub weekday: DayForm,
    pub weekend: DayForm,
}

fn to_hhmm(time: Option<NaiveTime>) -> String {
    time.map(|time| time.format("%H:%M").to_string())
        .unwrap_or_default()
}

impl From<&DayForm> for DayRestriction {
    fn from(form: &DayForm) -> Self {
        Self {
            lunch_start: parse_hhmm(&form.lunch_start),
            lunch_end: parse_hhmm(&form.lunch_end),
            end_time: parse_hhmm(&form.end_time),
        }
    }
}

impl From<&DayRestriction> for DayForm {
    fn from(day: &DayRestriction) -> Self {
        Self {
            lunch_start: to_hhmm(day.lunch_start),
            lunch_end: to_hhmm(day.lunch_end),
            end_time: to_hhmm(day.end_time),
        }
    }
}

impl From<&RestrictionsForm> for Restrictions {
    fn from(form: &RestrictionsForm) -> Self {
        Self {
            weekday: (&form.weekday).into(),
            weekend: (&form.weekend).into(),
        }
    }
}

impl From<&Restrictions> for RestrictionsForm {
    fn from(restrictions: &Restrictions) -> Self {
        Self {
            weekday: (&restrictions.weekday).into(),
            weekend: (&restrictions.weekend).into(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartBlock {
    Lunch {
        start: NaiveTime,
        end: NaiveTime,
        weekend: bool,
    },
    AfterEnd {
        end: NaiveTime,
        weekend: bool,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BoundaryKind {
    LunchStart,
    EndTime,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Passed {
    pub lunch_start: bool,
    pub lunch_end: bool,
    pub end_time: bool,
}

/// 前回の監視からこれ以上空いたら、過去の境界は掘り返さない（起動直後・スリープ復帰）。
pub const BOUNDARY_MAX_GAP: Duration = Duration::seconds(60);
/// 前回の記録がないとき、直前のどこまでを見るか。
const BOUNDARY_LOOKBACK: Duration = Duration::seconds(2);

pub fn is_weekend(date: NaiveDate) -> bool {
    use chrono::Datelike;
    matches!(date.weekday(), chrono::Weekday::Sat | chrono::Weekday::Sun)
}

/// "HH:MM"（`input type=time` の秒付きも可）を読み込む。空や不正な値は `None`。
pub fn parse_hhmm(text: &str) -> Option<NaiveTime> {
    let head: String = text.trim().chars().take(5).collect();
    NaiveTime::parse_from_str(&head, "%H:%M").ok()
}

impl Restrictions {
    pub fn for_date(&self, date: NaiveDate) -> &DayRestriction {
        if is_weekend(date) {
            &self.weekend
        } else {
            &self.weekday
        }
    }

    /// スタートできない理由。できるなら `None`。
    /// 昼休憩の時間帯は不可。終了時刻以降は翌日まで不可。
    pub fn start_block(&self, now: NaiveDateTime) -> Option<StartBlock> {
        let weekend = is_weekend(now.date());
        let r = self.for_date(now.date());
        let time = now.time();
        if let (Some(start), Some(end)) = (r.lunch_start, r.lunch_end)
            && start <= time
            && time < end
        {
            return Some(StartBlock::Lunch {
                start,
                end,
                weekend,
            });
        }
        if let Some(end) = r.end_time
            && time >= end
        {
            return Some(StartBlock::AfterEnd { end, weekend });
        }
        None
    }

    /// 昼休憩中なら終了までの残り（秒の切り上げ）。そうでなければ `None`。
    pub fn lunch_remaining(&self, now: NaiveDateTime) -> Option<Duration> {
        let r = self.for_date(now.date());
        let (start, end) = (r.lunch_start?, r.lunch_end?);
        let time = now.time();
        if !(start <= time && time < end) {
            return None;
        }
        let left = end - time;
        let secs = left.num_seconds() + i64::from(left.subsec_nanos() > 0);
        Some(Duration::seconds(secs))
    }

    /// 次に来る境界（昼休憩の開始か終了時刻）までの残り（秒の切り捨て）と種類。
    pub fn next_boundary(&self, now: NaiveDateTime) -> Option<(Duration, BoundaryKind)> {
        let r = self.for_date(now.date());
        let until = |target: Option<NaiveTime>| {
            let secs = (target? - now.time()).num_seconds();
            (secs > 0).then_some(Duration::seconds(secs))
        };
        let lunch = until(r.lunch_start).map(|d| (d, BoundaryKind::LunchStart));
        let end = until(r.end_time).map(|d| (d, BoundaryKind::EndTime));
        match (lunch, end) {
            (Some(a), Some(b)) => Some(if b.0 < a.0 { b } else { a }),
            (a, b) => a.or(b),
        }
    }
}

/// 境界の通過を、前回の監視から今までの区間で判定する。
/// 「今ちょうど過ぎた」だけで判定すると、監視が1回遅れただけで取りこぼすため。
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct BoundaryWatcher {
    last_checked: Option<NaiveDateTime>,
}

impl BoundaryWatcher {
    /// 前回の監視時刻を `now` にそろえる。設定を書き換えただけで鳴らさないために使う。
    pub fn reset(&mut self, now: NaiveDateTime) {
        self.last_checked = Some(now);
    }

    pub fn passed(&mut self, restrictions: &Restrictions, now: NaiveDateTime) -> Passed {
        let continuing = self
            .last_checked
            .filter(|prev| *prev <= now && now - *prev < BOUNDARY_MAX_GAP);
        let since = continuing.unwrap_or(now - BOUNDARY_LOOKBACK);
        self.last_checked = Some(now);

        let r = restrictions.for_date(now.date());
        let crossed = |time: Option<NaiveTime>| {
            time.is_some_and(|time| {
                let at = now.date().and_time(time);
                at > since && at <= now
            })
        };
        Passed {
            lunch_start: crossed(r.lunch_start),
            lunch_end: crossed(r.lunch_end),
            end_time: crossed(r.end_time),
        }
    }
}

#[cfg(test)]
mod tests;
