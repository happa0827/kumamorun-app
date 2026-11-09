//! 同期のワーカー。ログインの状態を持ち、毎秒、サーバーに送るべきものがないか見て送る。
//! 状態の持ち主は端末（`AppState`）で、ここはその写しをサーバーに預ける。
//! エンジンのロックは通信をまたいで持たない。

use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Notify;

use crate::app::{AppState, Evolutions, merge_remote};
use crate::storage::Progress;

use super::evolution::apply_pending;
use super::http::{Api, ApiError, backoff};
use super::link::code_from_link;
use super::live::LiveThrottle;
use super::token::{KeyringStore, TokenStore};
use super::wire::{self, SyncResponse};

/// 別の端末での変更を取り込むため、これだけ間を空けて同期し直す。
const RESYNC_EVERY: Duration = Duration::from_secs(600);

/// WebView に見せるクラウドの状態。
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudView {
    /// 接続先が決まっているか。リリースビルドで未設定なら false。
    pub configured: bool,
    pub logged_in: bool,
    /// 直近の通信が成功したか。
    pub connected: bool,
    pub stage: Option<u32>,
    pub flowers: Option<u32>,
    pub device_name: Option<String>,
    /// 利用者に見せる直近の失敗。成功したら消える。
    pub error: Option<String>,
}

#[derive(Default)]
struct Inner {
    view: CloudView,
    token: Option<String>,
    /// ログイン後の最初の同期が済んだか。済むまで、記録は書かない
    /// （空の記録でサーバーの前日分を上書きしないため）。
    synced: bool,
    settings_dirty: bool,
    last_days: String,
    throttle: LiveThrottle,
    failures: u32,
    next_attempt: Option<Instant>,
    last_sync: Option<Instant>,
}

pub struct Cloud {
    base: Option<String>,
    http: Option<Api>,
    tokens: Box<dyn TokenStore>,
    inner: Mutex<Inner>,
    wake: Notify,
}

/// 接続先。開発ビルドは環境変数で差し替えられる（既定はローカルの `void dev`）。
/// リリースビルドは、ビルド時に決めた値だけを使う。実行時の環境変数では変えられない。
pub fn base_url() -> Option<String> {
    if cfg!(debug_assertions) {
        Some(
            std::env::var("KUMAMORUN_API_BASE")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
        )
    } else {
        option_env!("KUMAMORUN_API_BASE")
            .filter(|base| !base.is_empty())
            .map(str::to_string)
    }
}

fn device_name() -> String {
    std::env::var("COMPUTERNAME")
        .ok()
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| "Windows PC".to_string())
}

fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

impl Cloud {
    pub fn new(base: Option<String>, tokens: Box<dyn TokenStore>) -> Self {
        let token = base.as_ref().and_then(|_| tokens.load());
        let view = CloudView {
            configured: base.is_some(),
            logged_in: token.is_some(),
            ..CloudView::default()
        };
        Self {
            http: base.as_deref().map(Api::new),
            base,
            tokens,
            inner: Mutex::new(Inner {
                view,
                token,
                ..Inner::default()
            }),
            wake: Notify::new(),
        }
    }

    pub fn open(base: Option<String>) -> Self {
        let tokens = KeyringStore::new(base.as_deref().unwrap_or(""));
        Self::new(base, Box::new(tokens))
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Inner> {
        self.inner.lock().expect("cloud")
    }

    pub fn view(&self) -> CloudView {
        self.lock().view.clone()
    }

    /// サイトのページの URL。`path` は `/` で始める。
    pub fn page_url(&self, path: &str) -> Option<String> {
        self.base.as_deref().map(|base| page_url(base, path))
    }

    pub fn mark_settings_dirty(&self) {
        self.lock().settings_dirty = true;
        self.wake.notify_one();
    }

    /// トークンつきのクライアント。ログインしていなければ `None`。
    fn api(&self) -> Option<Api> {
        let token = self.lock().token.clone()?;
        Some(self.http.as_ref()?.with_token(&token))
    }

    fn publish(&self, app: &AppHandle) {
        let _ = app.emit("cloud", self.view());
    }

    fn backing_off(&self) -> bool {
        self.lock()
            .next_attempt
            .is_some_and(|until| Instant::now() < until)
    }

    /// 通信に成功した。失敗の数え直しと、接続中の印。
    fn succeeded(&self, app: &AppHandle) {
        {
            let mut inner = self.lock();
            inner.failures = 0;
            inner.next_attempt = None;
            inner.view.connected = true;
            inner.view.error = None;
        }
        self.publish(app);
    }

    fn failed(&self, app: &AppHandle, error: &ApiError) {
        {
            let mut inner = self.lock();
            inner.view.connected = false;
            inner.view.error = Some(error.message());
            if *error == ApiError::Unauthorized {
                // トークンが失効した。再ログインが要る。
                inner.token = None;
                inner.synced = false;
                inner.view.logged_in = false;
                inner.view.stage = None;
                inner.view.flowers = None;
                drop(inner);
                self.tokens.clear();
            } else {
                inner.failures += 1;
                inner.next_attempt = Some(Instant::now() + backoff(inner.failures));
                inner.throttle.reset();
            }
        }
        eprintln!("同期に失敗しました: {}", error.message());
        self.publish(app);
    }

    fn is_synced(&self) -> bool {
        self.lock().synced
    }

    fn resync_due(&self) -> bool {
        self.lock()
            .last_sync
            .is_none_or(|at| at.elapsed() >= RESYNC_EVERY)
    }

    /// サーバーの内容を端末に取り込み終えた。
    fn after_sync(&self, app: &AppHandle, state: &AppState, remote: &SyncResponse, first: bool) {
        let mut remote = remote.clone();
        {
            let mut inner = self.lock();
            // 送りそびれた変更が残っているなら、サーバーの値で上書きしない。
            if inner.settings_dirty {
                remote.restrictions = None;
            } else if first && remote.restrictions.is_none() {
                inner.settings_dirty = true;
            }
        }
        merge_remote(app, state, &remote);
        state.set_progress(remote.progress());
        {
            let mut inner = self.lock();
            inner.synced = true;
            inner.last_sync = Some(Instant::now());
            inner.view.stage = Some(remote.stage);
            inner.view.flowers = Some(remote.flowers);
        }
        self.publish(app);
    }

    fn set_progress(&self, app: &AppHandle, progress: Progress) {
        {
            let mut inner = self.lock();
            inner.view.stage = Some(progress.stage);
            inner.view.flowers = Some(progress.flowers);
        }
        self.publish(app);
    }

    fn known_progress(&self, fallback: Option<Progress>) -> Progress {
        let inner = self.lock();
        match (inner.view.stage, inner.view.flowers) {
            (Some(stage), Some(flowers)) => Progress { stage, flowers },
            _ => fallback.unwrap_or(Progress {
                stage: 0,
                flowers: 0,
            }),
        }
    }

    fn take_settings_dirty(&self) -> bool {
        std::mem::take(&mut self.lock().settings_dirty)
    }

    /// 前回送った記録と違うときだけ true。
    fn days_changed(&self, key: &str) -> bool {
        self.lock().last_days != key
    }

    fn should_write_live(&self, status: &crate::domain::engine::live_status::LiveStatus) -> bool {
        self.lock().throttle.should_write(status, now_ms())
    }

    fn reset_live(&self) {
        self.lock().throttle.reset();
    }

    fn on_login(&self, app: &AppHandle, token: String) {
        {
            let mut inner = self.lock();
            inner.token = Some(token);
            inner.synced = false;
            inner.last_sync = None;
            inner.last_days.clear();
            inner.throttle.reset();
            inner.failures = 0;
            inner.next_attempt = None;
            inner.view = CloudView {
                configured: true,
                logged_in: true,
                device_name: Some(device_name()),
                ..CloudView::default()
            };
        }
        self.publish(app);
        self.wake.notify_one();
    }

    fn on_logout(&self, app: &AppHandle) {
        {
            let mut inner = self.lock();
            *inner = Inner {
                view: CloudView {
                    configured: self.base.is_some(),
                    ..CloudView::default()
                },
                ..Inner::default()
            };
        }
        self.publish(app);
    }

    fn set_error(&self, app: &AppHandle, message: String) {
        self.lock().view.error = Some(message);
        self.publish(app);
    }
}

/// ログイン後の最初の同期。まっさらなアカウントなら、端末のデータを取り込ませる。
async fn initial_sync(
    app: &AppHandle,
    cloud: &Cloud,
    api: &Api,
    state: &AppState,
) -> Result<(), ApiError> {
    let mut remote = api.sync().await?;
    if remote.is_empty() {
        let snapshot = state.snapshot();
        let body = wire::import_body(
            &snapshot.view.status,
            snapshot.progress,
            &snapshot.restrictions,
        );
        remote = match api.import(&body).await {
            Ok(imported) => imported,
            // 同時に別の端末が先に取り込んだ。その内容に従う。
            Err(ApiError::Conflict(_)) => api.sync().await?,
            Err(e) => return Err(e),
        };
    }
    cloud.after_sync(app, state, &remote, true);
    Ok(())
}

/// 送るべきものを順に送る。最初の失敗で止まる。通信をしたかを返す。
async fn sync_once(
    app: &AppHandle,
    cloud: &Cloud,
    api: &Api,
    state: &AppState,
) -> Result<bool, ApiError> {
    let mut did = false;
    if !cloud.is_synced() {
        initial_sync(app, cloud, api, state).await?;
        did = true;
    } else if cloud.resync_due() {
        let remote = api.sync().await?;
        cloud.after_sync(app, state, &remote, false);
        did = true;
    }

    if cloud.take_settings_dirty() {
        let snapshot = state.snapshot();
        let restrictions = serde_json::to_value(&snapshot.restrictions).expect("JSON にできる");
        if let Err(e) = api.put_settings(&restrictions).await {
            cloud.mark_settings_dirty();
            return Err(e);
        }
        did = true;
    }

    let snapshot = state.snapshot();
    let days = wire::days_body(&snapshot.view.status);
    let key = days.to_string();
    if cloud.days_changed(&key) {
        api.put_days(&days).await?;
        cloud.lock().last_days = key;
        did = true;
    }

    if snapshot.view.pending_evolutions > 0 {
        let progress = cloud.known_progress(snapshot.progress);
        let outcome = apply_pending(&Evolutions { app, state }, api, progress).await;
        cloud.set_progress(app, outcome.progress);
        did |= outcome.applied > 0;
        if let Some(error) = outcome.error {
            return Err(error);
        }
    }

    if cloud.should_write_live(&snapshot.view.status) {
        if let Err(e) = api
            .put_live_status(&wire::live_body(&snapshot.view.status))
            .await
        {
            cloud.reset_live();
            return Err(e);
        }
        did = true;
    }
    Ok(did)
}

async fn step(app: &AppHandle, cloud: &Cloud) {
    let Some(api) = cloud.api() else { return };
    if cloud.backing_off() {
        return;
    }
    let state = app.state::<AppState>();
    match sync_once(app, cloud, &api, &state).await {
        Ok(true) => cloud.succeeded(app),
        Ok(false) => {}
        Err(error) => cloud.failed(app, &error),
    }
}

async fn run(app: AppHandle) {
    let cloud = app.state::<Cloud>();
    loop {
        tokio::select! {
            () = cloud.wake.notified() => {}
            () = tokio::time::sleep(Duration::from_secs(1)) => {}
        }
        step(&app, &cloud).await;
    }
}

/// ログインのリンク（`kumamorun://auth?code=…`）を受けたとき。
pub fn handle_link(app: &AppHandle, link: &str) {
    let Some(code) = code_from_link(link) else {
        return;
    };
    crate::windows::show_main(app);
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let cloud = app.state::<Cloud>();
        if let Err(message) = log_in(&app, &cloud, &code).await {
            eprintln!("ログインできませんでした: {message}");
            cloud.set_error(&app, message);
        }
    });
}

async fn log_in(app: &AppHandle, cloud: &Cloud, code: &str) -> Result<(), String> {
    let http = cloud
        .http
        .as_ref()
        .ok_or("接続先が設定されていません（このビルドではログインできません）")?;
    let token = http
        .exchange(code, &device_name())
        .await
        .map_err(|e| match e {
            ApiError::Unauthorized => {
                "ログイン用のコードが無効か、期限切れです。もう一度やり直してください".to_string()
            }
            other => other.message(),
        })?;
    cloud.tokens.save(&token)?;
    cloud.on_login(app, token);
    Ok(())
}

/// ログアウト。先に「アプリは動いていない」を書き、サーバー側のトークンを失効してから消す。
/// 通信に失敗しても、端末からはログアウトする（サーバー側は、サイトの画面から失効できる）。
pub async fn log_out(app: &AppHandle) {
    let cloud = app.state::<Cloud>();
    if let Some(api) = cloud.api() {
        let _ = tokio::time::timeout(Duration::from_secs(5), async {
            let _ = api.offline().await;
            let _ = api.logout().await;
        })
        .await;
    }
    cloud.tokens.clear();
    cloud.on_logout(app);
}

/// アプリの終了時に、サイトを「停止」にする。強制終了の場合は、ハートビートが途絶えて停止になる。
pub fn offline_on_exit(app: &AppHandle) {
    let Some(cloud) = app.try_state::<Cloud>() else {
        return;
    };
    let Some(api) = cloud.api() else { return };
    tauri::async_runtime::block_on(async {
        let _ = tokio::time::timeout(Duration::from_secs(3), api.offline()).await;
    });
}

/// 起動時に一度。ワーカーと、ディープリンクの受け口を始める。
pub fn setup(app: &tauri::App) {
    use tauri_plugin_deep_link::DeepLinkExt;

    app.manage(Cloud::open(base_url()));

    // 開発ビルドは、インストーラーを経ないので、この実行ファイルをリンクの宛先に登録する。
    #[cfg(debug_assertions)]
    if let Err(e) = app.deep_link().register_all() {
        eprintln!("ディープリンクを登録できませんでした: {e}");
    }
    let handle = app.handle().clone();
    app.deep_link().on_open_url(move |event| {
        for url in event.urls() {
            handle_link(&handle, url.as_str());
        }
    });
    // リンクから起動されたときの、最初のリンク。
    if let Ok(Some(urls)) = app.deep_link().get_current() {
        for url in urls {
            handle_link(app.handle(), url.as_str());
        }
    }

    let handle = app.handle().clone();
    tauri::async_runtime::spawn(run(handle));
}

#[tauri::command]
pub fn get_cloud(cloud: tauri::State<Cloud>) -> CloudView {
    cloud.view()
}

/// ブラウザーでログインのページを開く。サイトが「アプリを開く」でリンクを渡してくる。
#[tauri::command]
pub fn open_login(app: AppHandle, cloud: tauri::State<Cloud>) -> Result<(), String> {
    open_page(&app, &cloud, "/link")
}

/// ブラウザーでサイトを開く（状況ページ。ログイン済みのブラウザーなら、そのまま見られる）。
#[tauri::command]
pub fn open_site(app: AppHandle, cloud: tauri::State<Cloud>) -> Result<(), String> {
    open_page(&app, &cloud, "/")
}

fn open_page(app: &AppHandle, cloud: &Cloud, path: &str) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let url = cloud
        .page_url(path)
        .ok_or("接続先が設定されていません（このビルドでは開けません）")?;
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| format!("ブラウザーを開けません: {e}"))
}

fn page_url(base: &str, path: &str) -> String {
    format!("{}{path}", base.trim_end_matches('/'))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ページのurlは_末尾のスラッシュの有無によらず同じ() {
        for base in [
            "https://example.workers.dev",
            "https://example.workers.dev/",
        ] {
            assert_eq!(page_url(base, "/link"), "https://example.workers.dev/link");
            assert_eq!(page_url(base, "/"), "https://example.workers.dev/");
        }
    }
}

#[tauri::command]
pub async fn log_out_cloud(app: AppHandle) {
    log_out(&app).await;
}
