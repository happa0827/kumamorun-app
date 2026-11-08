use std::collections::{BTreeMap, BTreeSet};

use chrono::{Duration, NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};

use crate::domain::effects::{Boundary, Effect, Notice, Sound, Surface};
use crate::domain::restrictions::{BoundaryKind, BoundaryWatcher, Restrictions, StartBlock};
use crate::domain::stop_confirm::{StopConfirm, StopKind, StopPrompt};
use crate::domain::timer::{Timer, TimerKind, WARN_BEFORE};

/// 休憩の猶予。遊びの完走後、休憩を開始すべき3分間。
pub const REWARD_WINDOW: Duration = Duration::minutes(3);
/// 直近何日分の記録を持つか。
pub const HISTORY_DAYS: i64 = 7;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct DayRecord {
    pub plays: u32,
    pub failures: u32,
}

impl DayRecord {
    /// 成功日: 遊びを1回以上完走し、失敗が0回だった日。
    pub fn is_success(&self) -> bool {
        self.plays > 0 && self.failures == 0
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WeekDay {
    pub date: NaiveDate,
    pub record: DayRecord,
}

/// 画面に出す状態。表示の優先順位は、昼休憩、稼働中・一時停止中のタイマー、
/// 休憩の猶予、時間切れ・打ち切り、待機の順。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Phase {
    Lunch,
    Play,
    Break,
    Paused,
    Reward,
    /// 時間切れ。
    Finished,
    /// スタート制限の境界で打ち切られた。
    Ended(BoundaryKind),
    Idle,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartError {
    Blocked(StartBlock),
    InvalidDuration,
}

impl StartError {
    /// 利用者に見せる文言。
    pub fn message(&self) -> String {
        match self {
            StartError::Blocked(block) => live_status::block_reason(*block),
            StartError::InvalidDuration => "秒数を入力してください".to_string(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Engine {
    today: NaiveDate,
    record: DayRecord,
    history: BTreeMap<NaiveDate, DayRecord>,
    play_finished_at: Option<NaiveDateTime>,
    pending_evolutions: u32,
    restrictions: Restrictions,
    watcher: BoundaryWatcher,
    timer: Option<Timer>,
    notify20: bool,
    /// 今日すでに知らせた境界。
    rang: BTreeSet<Boundary>,
    rang_date: NaiveDate,
    /// 制限時刻のアラームが鳴っている間。
    alarm_playing: bool,
    /// 今の昼休憩で、閉じられる状態にするよう伝え済みか。
    lunch_released: bool,
    stop_confirm: StopConfirm,
    /// 今日咲いた花。古い保存ファイルには無いので、無ければ None。
    #[serde(default)]
    bloom: Option<cloud::Bloom>,
}

impl Engine {
    pub fn new(now: NaiveDateTime) -> Self {
        Self {
            today: now.date(),
            record: DayRecord::default(),
            history: BTreeMap::new(),
            play_finished_at: None,
            pending_evolutions: 0,
            restrictions: Restrictions::default(),
            watcher: BoundaryWatcher::default(),
            timer: None,
            notify20: false,
            rang: BTreeSet::new(),
            rang_date: now.date(),
            alarm_playing: false,
            lunch_released: false,
            stop_confirm: StopConfirm::new(now.date()),
            bloom: None,
        }
    }

    /// スタート制限を設定する。書き換えただけで境界を通過したとはみなさない。
    pub fn set_restrictions(&mut self, restrictions: Restrictions, now: NaiveDateTime) {
        self.restrictions = restrictions;
        self.watcher.reset(now);
    }

    pub fn restrictions(&self) -> &Restrictions {
        &self.restrictions
    }

    /// 20-20-20ルールの通知を有効にするか。
    pub fn set_notify20(&mut self, enabled: bool) {
        self.notify20 = enabled;
    }

    pub fn notify20(&self) -> bool {
        self.notify20
    }

    /// 遊びまたは休憩を開始する。休憩は、開始した時刻で成功か失敗かを判定する。
    /// 断られたときは何も変えない（休憩の判定も消費しない）。
    pub fn start_timer(
        &mut self,
        kind: TimerKind,
        duration: Duration,
        now: NaiveDateTime,
    ) -> Result<Vec<Effect>, StartError> {
        if duration <= Duration::zero() {
            return Err(StartError::InvalidDuration);
        }
        if let Some(block) = self.restrictions.start_block(now) {
            return Err(StartError::Blocked(block));
        }
        if kind == TimerKind::Break {
            self.break_started(now);
        } else {
            self.roll_over(now);
        }
        self.timer = Some(Timer::start(kind, duration, now));
        Ok(vec![Effect::ReleaseAlwaysOnTop { force: true }])
    }

    pub fn pause(&mut self, now: NaiveDateTime) {
        if let Some(timer) = self.timer.as_mut() {
            timer.pause(now);
        }
    }

    pub fn resume(&mut self, now: NaiveDateTime) {
        if let Some(timer) = self.timer.as_mut() {
            timer.resume(now);
        }
    }

    /// 動いている（または一時停止中の）タイマーの残り。なければ `None`。
    pub fn timer_remaining(&self, now: NaiveDateTime) -> Option<Duration> {
        self.timer
            .as_ref()
            .filter(|timer| !timer.is_finished())
            .map(|timer| timer.remaining(now))
    }

    pub fn phase(&self, now: NaiveDateTime) -> Phase {
        if self.restrictions.lunch_remaining(now).is_some() {
            return Phase::Lunch;
        }
        if let Some(timer) = self.timer.as_ref().filter(|timer| !timer.is_finished()) {
            return match (timer.is_running(), timer.kind()) {
                (false, _) => Phase::Paused,
                (true, TimerKind::Play) => Phase::Play,
                (true, TimerKind::Break) => Phase::Break,
            };
        }
        if self.reward_remaining(now).is_some() {
            return Phase::Reward;
        }
        match self.timer.as_ref() {
            Some(timer) => match timer.ended_by() {
                Some(kind) => Phase::Ended(kind),
                None => Phase::Finished,
            },
            None => Phase::Idle,
        }
    }

    /// 毎秒（またはスリープ復帰の直後に）呼ぶ。日付変更の評価、タイマーの進行、
    /// 制限時刻の監視をまとめて行い、外側が実行すべきことを返す。
    /// 遅れて呼ばれても、時間切れのタイマーはこの呼び出しで完走として処理する。
    /// 完走と境界が同じ秒に重なったときは、完走を優先する。
    pub fn tick(&mut self, now: NaiveDateTime) -> Vec<Effect> {
        let mut effects = Vec::new();
        self.roll_over(now);
        if self.rang_date != now.date() {
            self.rang_date = now.date();
            self.rang.clear();
        }

        if let Some(timer) = self.timer.as_mut() {
            let kind = timer.kind();
            let events = timer.tick(now, self.notify20);
            if events.eye_break {
                effects.push(Effect::Notice(Notice::EyeBreak));
                effects.push(Effect::Sound(Sound::EyeBreak));
            }
            if events.warning {
                effects.push(Effect::Notice(Notice::TimerWarning {
                    kind,
                    minutes: (WARN_BEFORE.num_minutes()) as u32,
                }));
                effects.push(Effect::Sound(Sound::Warning));
            }
            if events.finished {
                self.on_timer_finished(kind, now, &mut effects);
            }
        }

        let passed = self.watcher.passed(&self.restrictions, now);
        if passed.lunch_start || passed.end_time {
            let (boundary, kind) = if passed.lunch_start {
                (Boundary::LunchStart, BoundaryKind::LunchStart)
            } else {
                (Boundary::EndTime, BoundaryKind::EndTime)
            };
            let stopped = self
                .timer
                .as_mut()
                .is_some_and(|timer| timer.stop_at_boundary(kind));
            self.ring(boundary, stopped, &mut effects);
        }
        if passed.lunch_end {
            self.ring(Boundary::LunchEnd, false, &mut effects);
        }
        // 昼休憩の開始と終了時刻は、音と同時に「やめた」確認を始める。
        if passed.lunch_start {
            self.stop_confirm.begin(StopKind::LunchStart, now);
        }
        if passed.end_time {
            self.stop_confirm.begin(StopKind::EndTime, now);
        }
        self.record.failures += self.stop_confirm.expire(now);

        if self.restrictions.lunch_remaining(now).is_none() {
            self.lunch_released = false;
        } else if !self.alarm_playing && !self.lunch_released {
            self.lunch_released = true;
            effects.push(Effect::ReleaseAlwaysOnTop { force: true });
        }
        effects
    }

    /// 表示すべき「やめた」確認。なければ `None`。
    pub fn stop_prompt(&self, now: NaiveDateTime) -> Option<StopPrompt> {
        self.stop_confirm.prompt(now)
    }

    /// 「やめた」を押した。終了時刻の確認ならスリープを要求する。
    pub fn press_stopped(&mut self, now: NaiveDateTime) -> Vec<Effect> {
        match self.stop_confirm.press(now) {
            Some(StopKind::EndTime) => vec![Effect::SleepNow],
            _ => Vec::new(),
        }
    }

    /// 制限時刻のアラームが鳴り終わった。
    pub fn alarm_finished(&mut self, now: NaiveDateTime) -> Vec<Effect> {
        self.alarm_playing = false;
        let mut effects = vec![Effect::ReleaseAlwaysOnTop { force: false }];
        if self.restrictions.lunch_remaining(now).is_some() {
            self.lunch_released = true;
            effects.push(Effect::ReleaseAlwaysOnTop { force: true });
        }
        effects
    }

    fn on_timer_finished(
        &mut self,
        kind: TimerKind,
        now: NaiveDateTime,
        effects: &mut Vec<Effect>,
    ) {
        // 昼休憩中は閉じられる。それ以外は次のタイマーを始めるまで閉じられない最前面にする。
        if self.restrictions.lunch_remaining(now).is_some() {
            self.lunch_released = true;
            effects.push(Effect::ReleaseAlwaysOnTop { force: true });
        } else {
            effects.push(Effect::Surface(Surface::Keep));
        }
        effects.push(Effect::Notice(Notice::TimerFinished(kind)));
        effects.push(Effect::Sound(Sound::Finish(kind)));
        if kind == TimerKind::Play {
            self.play_finished(now);
        }
    }

    /// 境界の通過を、1日に一度だけ知らせる。
    fn ring(&mut self, boundary: Boundary, stopped_play: bool, effects: &mut Vec<Effect>) {
        if !self.rang.insert(boundary) {
            return;
        }
        self.alarm_playing = true;
        effects.push(Effect::Surface(Surface::Alarm));
        effects.push(Effect::Notice(Notice::Boundary {
            boundary,
            stopped_play,
        }));
        effects.push(Effect::Sound(Sound::Alarm));
    }

    pub fn plays(&self) -> u32 {
        self.record.plays
    }

    pub fn failures(&self) -> u32 {
        self.record.failures
    }

    /// 未ログインなどで反映できていない進化の数。
    pub fn pending_evolutions(&self) -> u32 {
        self.pending_evolutions
    }

    /// 保留中の進化を1つ取り出す。ログイン中に同期層が呼ぶ。
    pub fn take_pending_evolution(&mut self) -> bool {
        if self.pending_evolutions == 0 {
            return false;
        }
        self.pending_evolutions -= 1;
        true
    }

    /// 休憩の猶予の残り。猶予中でなければ `None`。
    pub fn reward_remaining(&self, now: NaiveDateTime) -> Option<Duration> {
        let left = self.play_finished_at? + REWARD_WINDOW - now;
        (left > Duration::zero()).then_some(left)
    }

    /// 日付が変わっていれば前日を評価してリセットする。
    /// 評価するのは最後に記録した日だけで、間の日は遡らない。
    pub fn roll_over(&mut self, now: NaiveDateTime) {
        if now.date() == self.today {
            return;
        }
        // 「やめた」を押さず、窓の終わりも見届けられなかった確認は、ここで失敗にする。
        self.record.failures += self.stop_confirm.unsettled();
        self.stop_confirm = StopConfirm::new(now.date());
        if self.record.is_success() {
            self.pending_evolutions += 1;
        }
        self.history.insert(self.today, self.record);
        self.today = now.date();
        self.record = DayRecord::default();
        // 前日の猶予は日をまたいだ時点で無効にする。
        self.play_finished_at = None;
        self.prune_history();
    }

    /// 遊びを完走した。
    pub fn play_finished(&mut self, now: NaiveDateTime) {
        self.roll_over(now);
        self.play_finished_at = Some(now);
        self.record.plays += 1;
    }

    /// 休憩を開始した。猶予を過ぎていれば失敗にする。
    /// 判定に使った猶予はここで消費するので、同じ完走で二重に判定されない。
    pub fn break_started(&mut self, now: NaiveDateTime) {
        self.roll_over(now);
        let Some(finished_at) = self.play_finished_at.take() else {
            return;
        };
        if now - finished_at > REWARD_WINDOW {
            self.record.failures += 1;
        }
    }

    /// 直近7日分（古い順）。当日は進行中の値。記録のない日は 0。
    pub fn week(&self, now: NaiveDateTime) -> Vec<WeekDay> {
        let today = now.date();
        (0..HISTORY_DAYS)
            .rev()
            .map(|back| {
                let date = today - Duration::days(back);
                let record = if date == self.today {
                    self.record
                } else {
                    self.history.get(&date).copied().unwrap_or_default()
                };
                WeekDay { date, record }
            })
            .collect()
    }

    fn prune_history(&mut self) {
        let oldest = self.today - Duration::days(HISTORY_DAYS - 1);
        self.history.retain(|date, _| *date >= oldest);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn at(day: u32, h: u32, m: u32, s: u32) -> NaiveDateTime {
        NaiveDate::from_ymd_opt(2026, 11, day)
            .unwrap()
            .and_hms_opt(h, m, s)
            .unwrap()
    }

    fn date(day: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, 11, day).unwrap()
    }

    // 2026-11-09 は月曜日。

    #[test]
    fn 休憩の猶予内に休憩を開始しても失敗にならない() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.break_started(at(9, 10, 32, 0));
        assert_eq!(e.failures(), 0);
    }

    #[test]
    fn 猶予のちょうど3分は失敗にならず_1秒過ぎると失敗になる() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.break_started(at(9, 10, 33, 0));
        assert_eq!(e.failures(), 0);

        e.play_finished(at(9, 11, 0, 0));
        e.break_started(at(9, 11, 3, 1));
        assert_eq!(e.failures(), 1);
    }

    #[test]
    fn 猶予を過ぎてから休憩を開始すると失敗になる() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.break_started(at(9, 10, 40, 0));
        assert_eq!(e.failures(), 1);
    }

    #[test]
    fn 遊びを完走していなければ休憩を開始しても判定されない() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.break_started(at(9, 10, 40, 0));
        assert_eq!(e.failures(), 0);
    }

    #[test]
    fn 一回の完走で休憩を二度開始しても判定は一度だけ() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.break_started(at(9, 10, 40, 0));
        e.break_started(at(9, 10, 50, 0));
        assert_eq!(e.failures(), 1);
    }

    #[test]
    fn 完走のたびに遊び回数が増える() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.play_finished(at(9, 11, 30, 0));
        assert_eq!(e.plays(), 2);
    }

    #[test]
    fn 猶予の残りは猶予中だけ返る() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        assert_eq!(e.reward_remaining(at(9, 10, 0, 0)), None);
        e.play_finished(at(9, 10, 30, 0));
        assert_eq!(
            e.reward_remaining(at(9, 10, 31, 0)),
            Some(Duration::minutes(2))
        );
        assert_eq!(e.reward_remaining(at(9, 10, 33, 0)), None);
    }

    #[test]
    fn 休憩を開始せず放置しても失敗にならず_成功日になる() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.roll_over(at(10, 0, 0, 0));
        assert_eq!(e.failures(), 0);
        assert_eq!(e.pending_evolutions(), 1);
    }

    #[test]
    fn 成功日の翌日に進化が1つ保留される() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.break_started(at(9, 10, 31, 0));
        e.roll_over(at(10, 0, 0, 0));
        assert_eq!(e.pending_evolutions(), 1);
        assert!(e.take_pending_evolution());
        assert_eq!(e.pending_evolutions(), 0);
        assert!(!e.take_pending_evolution());
    }

    #[test]
    fn 失敗のあった日は進化しない() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.break_started(at(9, 10, 40, 0));
        e.roll_over(at(10, 0, 0, 0));
        assert_eq!(e.pending_evolutions(), 0);
    }

    #[test]
    fn 遊びのなかった日は進化しない() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.roll_over(at(10, 0, 0, 0));
        assert_eq!(e.pending_evolutions(), 0);
    }

    #[test]
    fn 同じ日のうちは進化を評価しない() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.roll_over(at(9, 23, 59, 59));
        assert_eq!(e.pending_evolutions(), 0);
        assert_eq!(e.plays(), 1);
    }

    #[test]
    fn 日付変更の評価は二重に進化しない() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.roll_over(at(10, 0, 0, 0));
        e.roll_over(at(10, 0, 1, 0));
        assert_eq!(e.pending_evolutions(), 1);
    }

    #[test]
    fn 日付変更で当日の回数がリセットされる() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.roll_over(at(10, 0, 0, 0));
        assert_eq!(e.plays(), 0);
        assert_eq!(e.failures(), 0);
    }

    #[test]
    fn 日付変更で前日の休憩の猶予は無効になる() {
        let mut e = Engine::new(at(9, 23, 59, 0));
        e.play_finished(at(9, 23, 59, 30));
        e.break_started(at(10, 0, 1, 0));
        assert_eq!(e.failures(), 0);
        assert_eq!(e.reward_remaining(at(10, 0, 1, 0)), None);
    }

    #[test]
    fn 数日空いても評価するのは最後に記録した日だけ() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.roll_over(at(13, 9, 0, 0));
        assert_eq!(e.pending_evolutions(), 1);
    }

    #[test]
    fn 保留した進化は積み重なる() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.roll_over(at(10, 0, 0, 0));
        e.play_finished(at(10, 10, 30, 0));
        e.roll_over(at(11, 0, 0, 0));
        assert_eq!(e.pending_evolutions(), 2);
    }

    #[test]
    fn 直近7日の記録は当日を含み_古い順に並ぶ() {
        let mut e = Engine::new(at(9, 10, 0, 0));
        e.play_finished(at(9, 10, 30, 0));
        e.roll_over(at(10, 0, 0, 0));
        e.play_finished(at(10, 10, 30, 0));
        e.play_finished(at(10, 11, 30, 0));

        let week = e.week(at(10, 12, 0, 0));
        assert_eq!(week.len(), 7);
        assert_eq!(week[0].date, date(4));
        assert_eq!(week[6].date, date(10));
        assert_eq!(
            week[5].record,
            DayRecord {
                plays: 1,
                failures: 0
            }
        );
        assert_eq!(
            week[6].record,
            DayRecord {
                plays: 2,
                failures: 0
            }
        );
        assert_eq!(week[0].record, DayRecord::default());
    }

    #[test]
    fn 七日より古い記録は直近七日に含まれない() {
        let mut e = Engine::new(at(1, 10, 0, 0));
        e.play_finished(at(1, 10, 30, 0));
        e.roll_over(at(2, 0, 0, 0));
        let week = e.week(at(9, 12, 0, 0));
        assert!(week.iter().all(|d| d.date != date(1)));
    }
}

pub mod cloud;
pub mod live_status;
mod restriction_edit;
pub mod view;

#[cfg(test)]
mod timer_tests;

#[cfg(test)]
mod view_tests;

#[cfg(test)]
mod stop_tests;

#[cfg(test)]
mod live_status_tests;

#[cfg(test)]
mod restart_tests;
