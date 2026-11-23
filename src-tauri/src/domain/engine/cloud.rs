//! クラウドとの記録のすり合わせ。状態の持ち主はこの端末（Rust）で、
//! クラウドの値は「この端末に無いものを補う」ためだけに取り込む。
//! 初回（Electron 版からの移行）や、別の端末で付いた前日の記録がその対象。

use std::collections::BTreeMap;

use chrono::{Duration, NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};

use crate::domain::growth::Flower;

use super::{DayRecord, Engine, HISTORY_DAYS};

/// クラウドの `dailyStats`。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CloudDay {
    pub date: NaiveDate,
    pub record: DayRecord,
}

/// 開花した日に、その日だけ表示する花。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Bloom {
    pub date: NaiveDate,
    pub flower: Flower,
}

impl Engine {
    /// 日付をまたいでいれば先に前日を評価してから、クラウドの記録で足りない分を補う。
    ///
    /// - 今日: この端末にまだ記録が無いときだけ、クラウドの今日を採る。
    /// - 直近7日の過去の日: この端末に無い日だけ補う。
    /// - `stats` が評価前の過去の日なら、その日が成功のとき進化を1つ保留にする
    ///   （Electron 版が最後に記録した日を、この端末が初めて評価する場合）。
    /// - 窓の外の古い日は、取り込まない（毎回評価し直さないため）。
    pub fn import_cloud(
        &mut self,
        stats: Option<CloudDay>,
        history: &BTreeMap<NaiveDate, DayRecord>,
        now: NaiveDateTime,
    ) {
        self.roll_over(now);
        let today = self.today;
        let oldest = today - Duration::days(HISTORY_DAYS - 1);
        let in_window = |date: NaiveDate| date >= oldest && date < today;

        if let Some(CloudDay { date, record }) = stats {
            if date == today {
                if self.record == DayRecord::default() {
                    self.record = record;
                }
            } else if in_window(date) && !self.history.contains_key(&date) {
                if record.is_success() {
                    self.pending_evolutions += 1;
                }
                self.history.insert(date, record);
            }
        }
        for (date, record) in history {
            if in_window(*date) {
                self.history.entry(*date).or_insert(*record);
            }
        }
    }

    /// 反映に失敗した進化を、保留に戻す。
    pub fn restore_pending_evolution(&mut self) {
        self.pending_evolutions += 1;
    }

    /// 開花した花を、その日の表示として覚える。
    pub fn set_bloom(&mut self, flower: Flower, now: NaiveDateTime) {
        self.bloom = Some(Bloom {
            date: now.date(),
            flower,
        });
    }

    /// 今日咲いた花。日をまたぐと `None`。
    pub fn bloom_today(&self, now: NaiveDateTime) -> Option<Flower> {
        self.bloom
            .filter(|bloom| bloom.date == now.date())
            .map(|bloom| bloom.flower)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn at(day: u32, h: u32) -> NaiveDateTime {
        date(day).and_hms_opt(h, 0, 0).unwrap()
    }

    fn date(day: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, 11, day).unwrap()
    }

    fn rec(plays: u32, failures: u32) -> DayRecord {
        DayRecord { plays, failures }
    }

    fn cloud(day: u32, plays: u32, failures: u32) -> Option<CloudDay> {
        Some(CloudDay {
            date: date(day),
            record: rec(plays, failures),
        })
    }

    fn week_record(e: &Engine, now: NaiveDateTime, day: u32) -> DayRecord {
        e.week(now)
            .into_iter()
            .find(|d| d.date == date(day))
            .unwrap()
            .record
    }

    #[test]
    fn 前日が成功の記録をクラウドから初めて取り込むと_進化が保留になる() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(9, 2, 0), &BTreeMap::new(), now);
        assert_eq!(e.pending_evolutions(), 1);
        assert_eq!(week_record(&e, now, 9), rec(2, 0));
    }

    #[test]
    fn 失敗のあった前日や遊びのない前日は進化しない() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(9, 2, 1), &BTreeMap::new(), now);
        assert_eq!(e.pending_evolutions(), 0);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(9, 0, 0), &BTreeMap::new(), now);
        assert_eq!(e.pending_evolutions(), 0);
    }

    #[test]
    fn 同じ前日を2回取り込んでも_二重に進化しない() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(9, 2, 0), &BTreeMap::new(), now);
        e.import_cloud(cloud(9, 2, 0), &BTreeMap::new(), now);
        assert_eq!(e.pending_evolutions(), 1);
    }

    #[test]
    fn この端末が自分で評価した前日は_取り込みで二重に進化しない() {
        let mut e = Engine::new(at(9, 10));
        e.play_finished(at(9, 10));
        // 取り込みの前に日付をまたぐ。前日（9日）はここで評価される。
        e.import_cloud(cloud(9, 1, 0), &BTreeMap::new(), at(10, 9));
        assert_eq!(e.pending_evolutions(), 1);
    }

    #[test]
    fn 今日の記録がこの端末に無ければクラウドの今日を採る() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(10, 3, 1), &BTreeMap::new(), now);
        assert_eq!((e.plays(), e.failures()), (3, 1));
        assert_eq!(e.pending_evolutions(), 0);
    }

    #[test]
    fn 今日の記録がこの端末にあれば_クラウドで上書きしない() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.play_finished(now);
        e.import_cloud(cloud(10, 9, 9), &BTreeMap::new(), now);
        assert_eq!((e.plays(), e.failures()), (1, 0));
    }

    #[test]
    fn 履歴はこの端末に無い日だけ補う() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(8, 1, 1), &BTreeMap::new(), now);
        let mut history = BTreeMap::new();
        history.insert(date(8), rec(7, 7));
        history.insert(date(7), rec(2, 0));
        e.import_cloud(None, &history, now);
        assert_eq!(week_record(&e, now, 8), rec(1, 1));
        assert_eq!(week_record(&e, now, 7), rec(2, 0));
        // 履歴だけの補完では進化しない。
        assert_eq!(e.pending_evolutions(), 0);
    }

    #[test]
    fn 窓の外の古い日と履歴にある今日は取り込まず_進化もしない() {
        let now = at(20, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(10, 5, 0), &BTreeMap::new(), now);
        assert_eq!(e.pending_evolutions(), 0);
        let mut history = BTreeMap::new();
        history.insert(date(20), rec(4, 4));
        history.insert(date(12), rec(1, 0));
        e.import_cloud(None, &history, now);
        assert_eq!((e.plays(), e.failures()), (0, 0));
        assert_eq!(week_record(&e, now, 14), rec(0, 0));
        // 7日分のうち一番古い日は 14 日。12 日は窓の外。
        assert!(e.week(now).iter().all(|d| d.date >= date(14)));
    }

    #[test]
    fn 反映できなかった進化は保留に戻せる() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(9, 1, 0), &BTreeMap::new(), now);
        assert!(e.take_pending_evolution());
        assert_eq!(e.pending_evolutions(), 0);
        e.restore_pending_evolution();
        assert_eq!(e.pending_evolutions(), 1);
    }

    #[test]
    fn 画面の状態に_保留中の進化と今日の花が載る() {
        let now = at(10, 9);
        let mut e = Engine::new(now);
        e.import_cloud(cloud(9, 1, 0), &BTreeMap::new(), now);
        e.set_bloom(Flower::BlueSpiderLily, now);
        let view = e.view(now, &|_| 0);
        assert_eq!(view.pending_evolutions, 1);
        assert_eq!(view.bloom, Some("blueSpiderLily"));
        let json = serde_json::to_value(&view).unwrap();
        assert_eq!(json["pendingEvolutions"], 1);
        assert_eq!(json["bloom"], "blueSpiderLily");
    }

    #[test]
    fn 咲いた花はその日だけ表示し_翌日には消える() {
        let mut e = Engine::new(at(10, 9));
        assert_eq!(e.bloom_today(at(10, 9)), None);
        e.set_bloom(Flower::Peony, at(10, 9));
        assert_eq!(e.bloom_today(at(10, 23)), Some(Flower::Peony));
        assert_eq!(e.bloom_today(at(11, 0)), None);
    }
}
