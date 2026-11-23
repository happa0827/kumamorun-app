//! サーバー（`/api/app/v1`）とやり取りする JSON の形。形は `docs/plan/void-migration.md` と同じ。
//! サーバーの値は信用しない: 日付や回数の検査は `cloud_input` が行う。

use serde::Deserialize;
use serde_json::{Map, Value, json};

use crate::characters::is_valid_version;
use crate::domain::engine::live_status::LiveStatus;
use crate::domain::restrictions::RestrictionsForm;
use crate::edition::Edition;
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
    /// `"full"`（承認済み）か `"demo"`。読み方は `edition()`。
    pub edition: Option<String>,
    /// 完全版のキャラクター画像の版。変わったら取り直す。読み方は `characters_version()`。
    pub characters_version: Option<String>,
}

impl SyncResponse {
    /// このアカウントの版。欠けていればデモ版。
    pub fn edition(&self) -> Edition {
        Edition::from_wire(self.edition.as_deref())
    }

    /// 取りに行くべき画像の版。完全版で、版の名前が正しいときだけ。
    pub fn characters_version(&self) -> Option<&str> {
        self.characters_version
            .as_deref()
            .filter(|version| self.edition().is_full() && is_valid_version(version))
    }

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

/// `GET /profile` の応答。サイトの設定画面で決めた名前と写真。
/// `image` は `data:` URL（自分で置いた写真）か `https:` URL（Google の写真）。それ以外は捨てる。
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(default)]
pub struct Profile {
    pub name: Option<String>,
    pub image: Option<String>,
}

impl Profile {
    /// WebView に出してよい形に直す。空の名前と、想定外の URL は無かったことにする。
    pub fn sanitized(self) -> Self {
        let name = self
            .name
            .map(|name| name.trim().to_string())
            .filter(|name| !name.is_empty());
        let image = self.image.filter(|url| {
            url.starts_with("https://")
                || ["image/webp", "image/jpeg", "image/png"]
                    .iter()
                    .any(|kind| url.starts_with(&format!("data:{kind};base64,")))
        });
        Self { name, image }
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
    fn プロフィールは_出せる画像のurlだけ残す() {
        let read = |value: Value| {
            serde_json::from_value::<Profile>(value)
                .unwrap()
                .sanitized()
        };
        let photo = "data:image/webp;base64,UklGR";
        assert_eq!(
            read(json!({"name": " くま ", "image": photo})),
            Profile {
                name: Some("くま".into()),
                image: Some(photo.into())
            }
        );
        let google = "https://lh3.googleusercontent.com/a/x";
        assert_eq!(
            read(json!({"image": google})).image.as_deref(),
            Some(google)
        );
        for bad in [
            "http://example.com/a.png",
            "javascript:alert(1)",
            "data:text/html;base64,PHNjcmlwdD4",
            "/api/avatars/x?v=1",
        ] {
            assert_eq!(read(json!({"image": bad})).image, None, "{bad}");
        }
        assert_eq!(
            read(json!({"name": "  ", "image": null})),
            Profile::default()
        );
    }

    #[test]
    fn 欠けたキーは既定値で読む() {
        let sync: SyncResponse = serde_json::from_value(json!({})).unwrap();
        assert!(sync.is_empty());
        assert_eq!(sync.edition(), Edition::Demo);
        assert_eq!(sync.characters_version(), None);
    }

    #[test]
    fn 画像の版は_完全版で正しい名前のときだけ取りに行く() {
        let read = |value: Value| serde_json::from_value::<SyncResponse>(value).unwrap();
        let full = read(json!({"edition": "full", "charactersVersion": "v1"}));
        assert_eq!(full.edition(), Edition::Full);
        assert_eq!(full.characters_version(), Some("v1"));
        let demo = read(json!({"edition": "demo", "charactersVersion": "v1"}));
        assert_eq!(demo.edition(), Edition::Demo);
        assert_eq!(demo.characters_version(), None);
        let bad = read(json!({"edition": "full", "charactersVersion": "../x"}));
        assert_eq!(bad.characters_version(), None);
        // 版はアカウントの中身ではないので、まっさらかどうかには関わらない。
        assert!(full.is_empty());
    }
}
