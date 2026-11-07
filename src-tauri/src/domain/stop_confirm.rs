//! やめた確認。昼休憩の開始時と終了時刻に、3分以内に「やめた」を押して
//! 遊びをやめたことを示す。押さなければ失敗になる。

use chrono::{Duration, NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};

/// 確認の窓。休憩の猶予と同じ3分。
pub const STOP_WINDOW: Duration = Duration::minutes(3);

/// 確認の種類。複数が重なったときは、この順に出す。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum StopKind {
    LunchStart,
    EndTime,
}

const ORDER: [StopKind; 2] = [StopKind::LunchStart, StopKind::EndTime];

/// 画面に出す確認。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StopPrompt {
    pub kind: StopKind,
    pub left: Duration,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
struct Entry {
    rang_at: NaiveDateTime,
    pressed: bool,
    failed: bool,
}

impl Entry {
    fn settled(&self) -> bool {
        self.pressed || self.failed
    }

    fn left(&self, now: NaiveDateTime) -> Duration {
        self.rang_at + STOP_WINDOW - now
    }
}

/// 1日分の確認。端末ローカルのみで、Firebase には載せない。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StopConfirm {
    date: NaiveDate,
    lunch_start: Option<Entry>,
    end_time: Option<Entry>,
}

impl StopConfirm {
    pub fn new(date: NaiveDate) -> Self {
        Self {
            date,
            lunch_start: None,
            end_time: None,
        }
    }

    pub fn date(&self) -> NaiveDate {
        self.date
    }

    fn entry(&self, kind: StopKind) -> Option<&Entry> {
        match kind {
            StopKind::LunchStart => self.lunch_start.as_ref(),
            StopKind::EndTime => self.end_time.as_ref(),
        }
    }

    fn entry_mut(&mut self, kind: StopKind) -> &mut Option<Entry> {
        match kind {
            StopKind::LunchStart => &mut self.lunch_start,
            StopKind::EndTime => &mut self.end_time,
        }
    }

    /// 境界を通過した瞬間から3分の窓を始める。決着済みなら二重に始めない。
    pub fn begin(&mut self, kind: StopKind, now: NaiveDateTime) {
        let slot = self.entry_mut(kind);
        if slot.is_some_and(|entry| entry.settled()) {
            return;
        }
        let rang_at = slot.map_or(now, |entry| entry.rang_at);
        *slot = Some(Entry {
            rang_at,
            pressed: false,
            failed: false,
        });
    }

    /// 表示中の確認。窓の残りがある未決着のうち、先頭の種類。
    pub fn prompt(&self, now: NaiveDateTime) -> Option<StopPrompt> {
        ORDER.into_iter().find_map(|kind| {
            let entry = self.entry(kind).filter(|entry| !entry.settled())?;
            let left = entry.left(now);
            (left > Duration::zero()).then_some(StopPrompt { kind, left })
        })
    }

    /// 「やめた」を押した。押せた確認の種類を返す。
    pub fn press(&mut self, now: NaiveDateTime) -> Option<StopKind> {
        let kind = self.prompt(now)?.kind;
        if let Some(entry) = self.entry_mut(kind).as_mut() {
            entry.pressed = true;
        }
        Some(kind)
    }

    /// 窓が尽きた未決着の確認を失敗にして、その数を返す。
    pub fn expire(&mut self, now: NaiveDateTime) -> u32 {
        let mut failed = 0;
        for kind in ORDER {
            if let Some(entry) = self.entry_mut(kind).as_mut() {
                if !entry.settled() && entry.left(now) <= Duration::zero() {
                    entry.failed = true;
                    failed += 1;
                }
            }
        }
        failed
    }

    /// 鳴ったのに押されず、失敗にもなっていない確認の数。
    /// アプリが止まっていて窓の終わりを逃した場合の保険に使う。
    pub fn unsettled(&self) -> u32 {
        ORDER
            .into_iter()
            .filter(|kind| self.entry(*kind).is_some_and(|entry| !entry.settled()))
            .count() as u32
    }
}
