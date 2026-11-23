//! クラウドから届いた記録（JSON）を、ドメインが受け取る形にする。
//! クラウドの値は信用しない: 形が違うものは捨てて、欠けた回数は 0 とみなす。

use std::collections::BTreeMap;

use chrono::NaiveDate;
use serde_json::Value;

use crate::domain::engine::DayRecord;
use crate::domain::engine::cloud::CloudDay;

fn count(value: &Value, key: &str) -> u32 {
    value
        .get(key)
        .and_then(Value::as_u64)
        .map_or(0, |n| u32::try_from(n).unwrap_or(u32::MAX))
}

fn record(value: &Value) -> Option<DayRecord> {
    value.is_object().then(|| DayRecord {
        plays: count(value, "plays"),
        failures: count(value, "failures"),
    })
}

fn date(text: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(text, "%Y-%m-%d").ok()
}

/// `dailyStats`: `{ date, plays, failures }`。
pub fn parse_stats(value: Option<&Value>) -> Option<CloudDay> {
    let value = value?;
    Some(CloudDay {
        date: date(value.get("date")?.as_str()?)?,
        record: record(value)?,
    })
}

/// `dailyHistory`: `{ "YYYY-MM-DD": { plays, failures }, … }`。
pub fn parse_history(value: Option<&Value>) -> BTreeMap<NaiveDate, DayRecord> {
    let Some(map) = value.and_then(Value::as_object) else {
        return BTreeMap::new();
    };
    map.iter()
        .filter_map(|(key, entry)| Some((date(key)?, record(entry)?)))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn day(d: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, 11, d).unwrap()
    }

    #[test]
    fn 当日の統計を読む() {
        let stats = parse_stats(Some(
            &json!({"date": "2026-11-09", "plays": 2, "failures": 1}),
        ));
        assert_eq!(
            stats,
            Some(CloudDay {
                date: day(9),
                record: DayRecord {
                    plays: 2,
                    failures: 1
                }
            })
        );
    }

    #[test]
    fn 欠けた回数は0とみなす() {
        let stats = parse_stats(Some(&json!({"date": "2026-11-09"}))).unwrap();
        assert_eq!(
            stats.record,
            DayRecord {
                plays: 0,
                failures: 0
            }
        );
    }

    #[test]
    fn 形の違う統計は捨てる() {
        assert_eq!(parse_stats(None), None);
        assert_eq!(parse_stats(Some(&json!(null))), None);
        assert_eq!(parse_stats(Some(&json!("x"))), None);
        assert_eq!(parse_stats(Some(&json!({"plays": 1}))), None);
        assert_eq!(
            parse_stats(Some(&json!({"date": "昨日", "plays": 1}))),
            None
        );
        assert_eq!(parse_stats(Some(&json!({"date": 20261109}))), None);
    }

    #[test]
    fn 負の値や小数は0として扱う() {
        let stats = parse_stats(Some(
            &json!({"date": "2026-11-09", "plays": -3, "failures": 1.5}),
        ));
        assert_eq!(
            stats.unwrap().record,
            DayRecord {
                plays: 0,
                failures: 0
            }
        );
    }

    #[test]
    fn 履歴を読み_読めない行は捨てる() {
        let history = parse_history(Some(&json!({
            "2026-11-08": {"plays": 1, "failures": 0},
            "2026-11-07": {"plays": 3},
            "bad-date": {"plays": 9, "failures": 9},
            "2026-11-06": 5,
        })));
        assert_eq!(history.len(), 2);
        assert_eq!(
            history[&day(8)],
            DayRecord {
                plays: 1,
                failures: 0
            }
        );
        assert_eq!(
            history[&day(7)],
            DayRecord {
                plays: 3,
                failures: 0
            }
        );
    }

    #[test]
    fn 履歴が無い_または配列なら空() {
        assert!(parse_history(None).is_empty());
        assert!(parse_history(Some(&json!([1, 2]))).is_empty());
        assert!(parse_history(Some(&json!(null))).is_empty());
    }
}
