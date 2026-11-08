//! サーバー（`/api/app/v1`）とやり取りする JSON の形。形は `docs/plan/void-migration.md` と同じ。
//! サーバーの値は信用しない: 日付や回数の検査は `cloud_input` が行う。

use serde::Deserialize;
use serde_json::{Map, Value, json};

use crate::domain::engine::live_status::LiveStatus;
use crate::domain::restrictions::RestrictionsForm;
use crate::storage::Progress;

/// `GET /sync` と `POST /import` の応答。
#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SyncResponse {
    pub restrictions: Option<Value>,
    pub daily: Option<Value>,
    pub history: Value,
    pub stage: u32,
    pub flowers: u32,
}

impl SyncResponse {
    /// 何も保存されていない、まっさらなアカウントか。
    pub fn is_empty(&self) -> bool {
        self.restrictions.is_none()
            && self.daily.is_none()
            && self.history.as_object().is_none_or(Map::is_empty)
            && self.stage == 0
            && self.flowers == 0
    }

    pub fn progress(&self) -> Progress {
        Progress {
            stage: self.stage,
            flowers: self.flowers,
        }
    }
}

/// 回数が 0 の日は送らない（空の記録で、サーバーの記録を埋めないため）。
fn history_of(status: &LiveStatus) -> Value {
    let map: Map<String, Value> = status
        .week
        .iter()
        .flatten()
        .filter(|day| day.plays > 0 || day.failures > 0)
        .map(|day| {
            (
                day.date.clone(),
                json!({ "plays": day.plays, "failures": day.failures }),
            )
        })
        .collect();
    Value::Object(map)
}

fn daily_of(status: &LiveStatus) -> Value {
    status.daily.as_ref().map_or(
        Value::Null,
        |daily| json!({ "date": daily.date, "plays": daily.plays, "failures": daily.failures }),
    )
}

/// `PUT /days` の本文。
pub fn days_body(status: &LiveStatus) -> Value {
    json!({ "daily": daily_of(status), "history": history_of(status) })
}

/// `POST /import` の本文。進化段階は 0〜5 に収める（旧版の 6 は 5 にする）。
pub fn import_body(
    status: &LiveStatus,
    progress: Option<Progress>,
    restrictions: &RestrictionsForm,
) -> Value {
    let progress = progress.unwrap_or(Progress {
        stage: 0,
        flowers: 0,
    });
    json!({
        "daily": daily_of(status),
        "history": history_of(status),
        "stage": progress.stage.min(5),
        "flowers": progress.flowers,
        "restrictions": restrictions,
    })
}

/// `PUT /live-status` の本文。`appRunning` と `updatedAt` はサーバーが決めるので送らない。
pub fn live_body(status: &LiveStatus) -> Value {
    let mut value = serde_json::to_value(status).expect("LiveStatus は JSON にできる");
    if let Some(map) = value.as_object_mut() {
        map.remove("appRunning");
    }
    value
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::engine::live_status::{DailyEntry, WeekEntry};

    fn status() -> LiveStatus {
        LiveStatus {
            daily: Some(DailyEntry {
                date: "2026-11-09".into(),
                plays: 2,
                failures: 1,
            }),
            week: Some(vec![
                WeekEntry {
                    date: "2026-11-08".into(),
                    plays: 3,
                    failures: 0,
                    success: true,
                },
                WeekEntry {
                    date: "2026-11-07".into(),
                    plays: 0,
                    failures: 0,
                    success: false,
                },
            ]),
            ..LiveStatus::offline()
        }
    }

    #[test]
    fn 記録の本文は_回数が0の日を送らない() {
        let body = days_body(&status());
        assert_eq!(
            body["daily"],
            json!({"date": "2026-11-09", "plays": 2, "failures": 1})
        );
        assert_eq!(
            body["history"],
            json!({"2026-11-08": {"plays": 3, "failures": 0}})
        );
    }

    #[test]
    fn 記録が無ければ_dailyはnullで履歴は空() {
        let body = days_body(&LiveStatus::offline());
        assert_eq!(body["daily"], Value::Null);
        assert_eq!(body["history"], json!({}));
    }

    #[test]
    fn ライブ状況の本文に_稼働の印と更新時刻は含めない() {
        let body = live_body(&status());
        assert!(body.get("appRunning").is_none());
        assert_eq!(body["phase"], "offline");
        assert_eq!(body["remainingSec"], Value::Null);
        assert!(body.get("updatedAt").is_none());
        // サーバーが要求するキーはすべて持つ。
        for key in [
            "keeping",
            "phase",
            "label",
            "remainingSec",
            "startedAt",
            "duration",
            "running",
            "startBlocked",
            "blockReason",
            "daily",
            "week",
        ] {
            assert!(body.get(key).is_some(), "{key} が無い");
        }
    }

    #[test]
    fn 取り込みの本文は_進化段階を5までに収める() {
        let body = import_body(
            &status(),
            Some(Progress {
                stage: 6,
                flowers: 9,
            }),
            &RestrictionsForm::default(),
        );
        assert_eq!(body["stage"], 5);
        assert_eq!(body["flowers"], 9);
        assert_eq!(body["restrictions"]["weekday"]["lunchStart"], "");
    }

    #[test]
    fn 取り込みの本文は_控えが無ければ0から() {
        let body = import_body(&status(), None, &RestrictionsForm::default());
        assert_eq!(body["stage"], 0);
        assert_eq!(body["flowers"], 0);
    }

    #[test]
    fn まっさらなアカウントを見分ける() {
        let empty: SyncResponse = serde_json::from_value(
            json!({"restrictions": null, "daily": null, "history": {}, "stage": 0, "flowers": 0, "serverTime": 1}),
        )
        .unwrap();
        assert!(empty.is_empty());
        for filled in [
            json!({"restrictions": {}, "history": {}, "stage": 0, "flowers": 0}),
            json!({"daily": {"date": "2026-11-09", "plays": 0, "failures": 0}, "history": {}, "stage": 0, "flowers": 0}),
            json!({"history": {"2026-11-08": {"plays": 1, "failures": 0}}, "stage": 0, "flowers": 0}),
            json!({"history": {}, "stage": 1, "flowers": 0}),
            json!({"history": {}, "stage": 0, "flowers": 1}),
        ] {
            let sync: SyncResponse = serde_json::from_value(filled).unwrap();
            assert!(!sync.is_empty(), "{sync:?}");
        }
    }

    #[test]
    fn 欠けたキーは既定値で読む() {
        let sync: SyncResponse = serde_json::from_value(json!({})).unwrap();
        assert!(sync.is_empty());
    }
}
