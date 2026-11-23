//! サーバー（`/api/app/v1`）の呼び出し。認証は `Authorization: Bearer <端末のトークン>`。
//! 失敗は、再試行してよいものと、してはいけないものに分けて返す。

use std::time::Duration;

use reqwest::{Client, Method, RequestBuilder};
use serde_json::{Value, json};

use crate::characters::{MAX_BYTES, is_png};
use crate::storage::Progress;

use super::evolution::{EvolutionApi, EvolveError};
use super::wire::{Profile, SyncResponse};

#[derive(Debug, Clone, PartialEq)]
pub enum ApiError {
    /// トークンが無効、または失効した。再ログインが要る。
    Unauthorized,
    /// 比較つきの書き込みが衝突した、または取り込み先が空でなかった。本文を添える。
    Conflict(Value),
    /// 承認されていないアカウントが、完全版の機能（画像、進化）を求めた（`403`）。
    /// トークンは有効なので、ログインは消さない。
    Forbidden,
    /// 形が不正など。同じ要求を繰り返しても通らない。再試行しない。
    Invalid(String),
    /// 通信の失敗、混雑、サーバーの障害。間隔を延ばして再試行する。
    Retry(String),
}

impl ApiError {
    pub fn message(&self) -> String {
        match self {
            ApiError::Unauthorized => "ログインの有効期限が切れました".to_string(),
            ApiError::Conflict(_) => "サーバーの内容と食い違っています".to_string(),
            ApiError::Forbidden => "このアカウントは完全版として承認されていません".to_string(),
            ApiError::Invalid(body) => format!("サーバーが受け付けませんでした: {body}"),
            ApiError::Retry(reason) => format!("サーバーにつながりません: {reason}"),
        }
    }
}

/// 2xx 以外の応答を分類する。
pub fn classify(status: u16, body: &str) -> ApiError {
    match status {
        401 => ApiError::Unauthorized,
        409 => ApiError::Conflict(serde_json::from_str(body).unwrap_or(Value::Null)),
        403 => ApiError::Forbidden,
        400 | 404 | 413 | 422 => ApiError::Invalid(body.chars().take(200).collect()),
        _ => ApiError::Retry(format!("{status}")),
    }
}

/// JSON の応答の上限。プロフィールの写真（`data:` URL）を含んでも収まる大きさ。
const MAX_JSON_BYTES: usize = 8 * 1024 * 1024;

/// 失敗が続くほど間を空ける。2秒から始めて倍にし、5分で頭打ち。
pub fn backoff(failures: u32) -> Duration {
    let secs = 2u64.saturating_mul(1u64 << failures.min(10).saturating_sub(1));
    Duration::from_secs(secs.min(300))
}

#[derive(Clone)]
pub struct Api {
    client: Client,
    base: String,
    token: Option<String>,
}

impl Api {
    pub fn new(base: &str) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .user_agent(concat!("kumamorun/", env!("CARGO_PKG_VERSION")))
            .build()
            .expect("HTTP クライアントを作れる");
        Self {
            client,
            base: base.trim_end_matches('/').to_string(),
            token: None,
        }
    }

    pub fn with_token(&self, token: &str) -> Self {
        Self {
            token: Some(token.to_string()),
            ..self.clone()
        }
    }

    /// 要求を組み立てる。`query` はクエリ（`?v=…` など）で、値のエスケープは reqwest に任せる。
    fn request(&self, method: Method, path: &str, query: &[(&str, &str)]) -> RequestBuilder {
        let url = format!("{}/api/app/v1{path}", self.base);
        let mut request = self.client.request(method, url);
        if !query.is_empty() {
            request = request.query(query);
        }
        if let Some(token) = &self.token {
            request = request.bearer_auth(token);
        }
        request
    }

    /// 本文を `max` バイトまで読む。超えたら、その場で読むのをやめて `Invalid` にする。
    async fn call_bytes(
        &self,
        method: Method,
        path: &str,
        body: Option<&Value>,
        max: usize,
    ) -> Result<Vec<u8>, ApiError> {
        self.send_bytes(self.request(method, path, &[]), body, max)
            .await
    }

    async fn send_bytes(
        &self,
        mut request: RequestBuilder,
        body: Option<&Value>,
        max: usize,
    ) -> Result<Vec<u8>, ApiError> {
        if let Some(body) = body {
            request = request.json(body);
        }
        let mut response = request
            .send()
            .await
            .map_err(|e| ApiError::Retry(e.without_url().to_string()))?;
        let status = response.status().as_u16();
        let ok = (200..300).contains(&status);
        // 401 と 403 は本文が要らない。本文を読む前に返す（読めなくても「再試行」にしない）。
        match status {
            401 => return Err(ApiError::Unauthorized),
            403 => return Err(ApiError::Forbidden),
            _ => {}
        }
        let too_large = || ApiError::Invalid(format!("応答が大きすぎます（{max} バイトまで）"));
        if ok
            && response
                .content_length()
                .is_some_and(|len| len > max as u64)
        {
            return Err(too_large());
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response
            .chunk()
            .await
            .map_err(|e| ApiError::Retry(e.without_url().to_string()))?
        {
            if bytes.len() + chunk.len() > max {
                if ok {
                    return Err(too_large());
                }
                // 失敗の応答は、読めた分だけで分類する。
                break;
            }
            bytes.extend_from_slice(&chunk);
        }
        if ok {
            Ok(bytes)
        } else {
            Err(classify(status, &String::from_utf8_lossy(&bytes)))
        }
    }

    async fn call(
        &self,
        method: Method,
        path: &str,
        body: Option<&Value>,
    ) -> Result<String, ApiError> {
        let bytes = self.call_bytes(method, path, body, MAX_JSON_BYTES).await?;
        String::from_utf8(bytes).map_err(|_| ApiError::Invalid("応答が文字列ではありません".into()))
    }

    fn parse<T: serde::de::DeserializeOwned>(text: &str) -> Result<T, ApiError> {
        serde_json::from_str(text).map_err(|e| ApiError::Invalid(format!("応答を読めません: {e}")))
    }

    /// 使い捨てコードを端末のトークンに交換する。
    pub async fn exchange(&self, code: &str, device_name: &str) -> Result<String, ApiError> {
        let body = json!({ "code": code, "deviceName": device_name });
        let text = self.call(Method::POST, "/exchange", Some(&body)).await?;
        let value: Value = Self::parse(&text)?;
        value["token"]
            .as_str()
            .map(str::to_string)
            .ok_or_else(|| ApiError::Invalid("応答にトークンがありません".into()))
    }

    pub async fn sync(&self) -> Result<SyncResponse, ApiError> {
        Self::parse(&self.call(Method::GET, "/sync", None).await?)
    }

    pub async fn profile(&self) -> Result<Profile, ApiError> {
        Self::parse::<Profile>(&self.call(Method::GET, "/profile", None).await?)
            .map(Profile::sanitized)
    }

    pub async fn put_settings(&self, restrictions: &Value) -> Result<(), ApiError> {
        let body = json!({ "restrictions": restrictions });
        self.call(Method::PUT, "/settings", Some(&body))
            .await
            .map(drop)
    }

    pub async fn put_days(&self, body: &Value) -> Result<(), ApiError> {
        self.call(Method::PUT, "/days", Some(body)).await.map(drop)
    }

    pub async fn put_live_status(&self, body: &Value) -> Result<(), ApiError> {
        self.call(Method::PUT, "/live-status", Some(body))
            .await
            .map(drop)
    }

    pub async fn offline(&self) -> Result<(), ApiError> {
        self.call(Method::POST, "/live-status/offline", None)
            .await
            .map(drop)
    }

    pub async fn import(&self, body: &Value) -> Result<SyncResponse, ApiError> {
        Self::parse(&self.call(Method::POST, "/import", Some(body)).await?)
    }

    pub async fn logout(&self) -> Result<(), ApiError> {
        self.call(Method::POST, "/logout", None).await.map(drop)
    }

    /// 完全版のキャラクター画像（PNG）を1枚、`/sync` の `charactersVersion` の版で取る。
    /// 10枚すべてを同じ版で取るので、途中で新しい版が公開されても、新旧が混ざらない。
    /// その版がサーバーに無ければ `404`（`Invalid`）。承認されていなければ `Forbidden`。
    pub async fn character(&self, key: &str, version: &str) -> Result<Vec<u8>, ApiError> {
        let request = self.character_request(key, version);
        let bytes = self.send_bytes(request, None, MAX_BYTES).await?;
        if !is_png(&bytes) {
            return Err(ApiError::Invalid(format!("{key} の画像を読めません")));
        }
        Ok(bytes)
    }

    fn character_request(&self, key: &str, version: &str) -> RequestBuilder {
        self.request(
            Method::GET,
            &format!("/characters/{key}"),
            &[("v", version)],
        )
    }
}

fn progress_of(value: &Value) -> Option<Progress> {
    Some(Progress {
        stage: u32::try_from(value.get("stage")?.as_u64()?).ok()?,
        flowers: u32::try_from(value.get("flowers")?.as_u64()?).ok()?,
    })
}

impl EvolutionApi for Api {
    async fn evolve(&self, expected: u32, next: u32, add: u32) -> Result<Progress, EvolveError> {
        let body = json!({ "expectedStage": expected, "nextStage": next, "flowersToAdd": add });
        match self.call(Method::POST, "/evolve", Some(&body)).await {
            Ok(text) => {
                let value: Value = Self::parse(&text).map_err(EvolveError::Api)?;
                progress_of(&value).ok_or_else(|| {
                    EvolveError::Api(ApiError::Invalid("応答に段階と花の数がありません".into()))
                })
            }
            Err(ApiError::Conflict(body)) => match progress_of(&body["current"]) {
                Some(current) => Err(EvolveError::Conflict(current)),
                None => Err(EvolveError::Api(ApiError::Invalid(
                    "衝突の応答に今の値がありません".into(),
                ))),
            },
            Err(e) => Err(EvolveError::Api(e)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn 応答の分類() {
        assert_eq!(classify(401, ""), ApiError::Unauthorized);
        assert_eq!(
            classify(409, r#"{"error":"conflict"}"#),
            ApiError::Conflict(json!({"error": "conflict"}))
        );
        assert_eq!(classify(409, "壊れた"), ApiError::Conflict(Value::Null));
        assert_eq!(classify(403, "x"), ApiError::Forbidden);
        for status in [400, 404, 413, 422] {
            assert!(matches!(classify(status, "x"), ApiError::Invalid(_)));
        }
        for status in [429, 500, 502, 503, 504] {
            assert!(matches!(classify(status, "x"), ApiError::Retry(_)));
        }
    }

    #[test]
    fn 画像は版を付けて取る() {
        let api = Api::new("https://example.workers.dev/").with_token("t");
        let version = "2026-11-23T03.27.15.924Z-7c589cef7eb1";
        let request = api.character_request("stage0", version).build().unwrap();
        assert_eq!(request.method(), Method::GET);
        assert_eq!(
            request.url().as_str(),
            format!("https://example.workers.dev/api/app/v1/characters/stage0?v={version}")
        );
        assert_eq!(request.headers()["authorization"], "Bearer t");
    }

    #[test]
    fn 再試行の間隔は倍々で_5分で頭打ち() {
        let secs = |n| backoff(n).as_secs();
        assert_eq!(secs(1), 2);
        assert_eq!(secs(2), 4);
        assert_eq!(secs(3), 8);
        assert_eq!(secs(8), 256);
        assert_eq!(secs(9), 300);
        assert_eq!(secs(100), 300);
    }

    #[test]
    fn 段階と花の読み取り() {
        assert_eq!(
            progress_of(&json!({"stage": 3, "flowers": 9})),
            Some(Progress {
                stage: 3,
                flowers: 9
            })
        );
        assert_eq!(progress_of(&json!({"stage": -1, "flowers": 9})), None);
        assert_eq!(progress_of(&json!({"stage": 3})), None);
        assert_eq!(progress_of(&Value::Null), None);
    }

    /// ローカルの `void dev` に対する通し確認。
    ///   KUMAMORUN_E2E_BASE=http://localhost:5173 KUMAMORUN_E2E_CODE=<ログインコード> \
    ///   cargo test --lib 実サーバー -- --ignored
    /// コードは、サイトで登録してから `POST /api/login-code` で作る（一度しか使えない）。
    #[test]
    #[ignore = "ローカルの void dev と、新しいログインコードが要る"]
    fn 実サーバーとの通し() {
        use crate::domain::engine::live_status::{DailyEntry, LiveStatus, WeekEntry};
        use crate::domain::restrictions::RestrictionsForm;

        let base = std::env::var("KUMAMORUN_E2E_BASE").expect("KUMAMORUN_E2E_BASE");
        assert!(base.starts_with("http://localhost"), "ローカルだけで使う");
        let code = std::env::var("KUMAMORUN_E2E_CODE").expect("KUMAMORUN_E2E_CODE");

        tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap()
            .block_on(async {
                let anon = Api::new(&base);
                assert_eq!(
                    anon.exchange("でたらめ", "E2E-PC").await,
                    Err(ApiError::Unauthorized)
                );
                let token = anon.exchange(&code, "E2E-PC").await.expect("交換");
                assert_eq!(
                    anon.exchange(&code, "E2E-PC").await,
                    Err(ApiError::Unauthorized),
                    "コードは一度しか使えない"
                );
                let api = anon.with_token(&token);

                // まっさらなアカウントは、取り込みを受け付ける。
                let empty = api.sync().await.expect("同期");
                assert!(empty.is_empty());
                let status = LiveStatus {
                    daily: Some(DailyEntry {
                        date: "2026-11-08".into(),
                        plays: 3,
                        failures: 1,
                    }),
                    week: Some(vec![WeekEntry {
                        date: "2026-11-07".into(),
                        plays: 2,
                        failures: 0,
                        success: true,
                    }]),
                    ..LiveStatus::offline()
                };
                let body = super::super::wire::import_body(
                    &status,
                    Some(Progress {
                        stage: 4,
                        flowers: 7,
                    }),
                    &RestrictionsForm::default(),
                );
                let imported = api.import(&body).await.expect("取り込み");
                assert_eq!(
                    imported.progress(),
                    Progress {
                        stage: 4,
                        flowers: 7
                    }
                );
                assert!(matches!(
                    api.import(&body).await,
                    Err(ApiError::Conflict(_))
                ));

                // 設定と記録。
                api.put_settings(&json!({"weekday": {"endTime": "21:00"}}))
                    .await
                    .expect("設定");
                api.put_days(&super::super::wire::days_body(&status))
                    .await
                    .expect("記録");
                let synced = api.sync().await.expect("同期");
                assert_eq!(synced.restrictions.unwrap()["weekday"]["endTime"], "21:00");
                assert_eq!(synced.daily.unwrap()["plays"], 3);

                // 進化: 成長、衝突、開花。
                assert_eq!(
                    api.evolve(4, 5, 0).await,
                    Ok(Progress {
                        stage: 5,
                        flowers: 7
                    })
                );
                assert_eq!(
                    api.evolve(4, 5, 0).await,
                    Err(EvolveError::Conflict(Progress {
                        stage: 5,
                        flowers: 7
                    }))
                );
                assert_eq!(
                    api.evolve(5, 0, 2).await,
                    Ok(Progress {
                        stage: 0,
                        flowers: 9
                    })
                );
                assert!(matches!(
                    api.evolve(0, 2, 0).await,
                    Err(EvolveError::Api(ApiError::Invalid(_)))
                ));

                // ライブ状況とオフライン。
                let playing = LiveStatus {
                    phase: "play".into(),
                    label: "遊び".into(),
                    running: true,
                    keeping: true,
                    remaining_sec: Some(600),
                    started_at: Some(1_794_100_000_000),
                    duration: Some(900),
                    ..status
                };
                api.put_live_status(&super::super::wire::live_body(&playing))
                    .await
                    .expect("ライブ状況");
                api.offline().await.expect("オフライン");

                // ログアウト後は、トークンが使えない。
                api.logout().await.expect("ログアウト");
                assert_eq!(api.sync().await, Err(ApiError::Unauthorized));
            });
    }

    #[test]
    fn エラーの文言に_トークンやurlは含まれない() {
        let message = ApiError::Retry("timed out".into()).message();
        assert!(!message.contains("http"));
    }
}
