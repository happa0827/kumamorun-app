//! 同期のワーカー。ログインの状態を持ち、毎秒、サーバーに送るべきものがないか見て送る。
//! 状態の持ち主は端末（`AppState`）で、ここはその写しをサーバーに預ける。
//! エンジンのロックは通信をまたいで持たない。

use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Notify;

use crate::app::{AppState, Evolutions, merge_remote, set_edition};
use crate::characters::{CharacterCache, KEYS};
use crate::edition::Edition;
use crate::storage::Progress;

use super::evolution::apply_pending;
use super::http::{Api, ApiError, backoff};
use super::link::code_from_link;
use super::live::LiveThrottle;
use super::token::{KeyringStore, TokenStore};
use super::wire::{self, Profile, SyncResponse};

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
    /// サイトの設定画面で決めた名前。まだ届いていなければ `None`。
    pub name: Option<String>,
    /// サイトの設定画面で決めた写真（`data:` か `https:` の URL）。無ければ `None`。
    pub image: Option<String>,
    /// 利用者に見せる直近の失敗。成功したら消える。
    pub error: Option<String>,
    /// アプリの版。ログインしていなければデモ版。
    pub edition: Edition,
    /// 端末にそろっている完全版の画像の版。そろっていなければ `None`（シルエットを出す）。
    pub characters_version: Option<String>,
}

#[derive(Default)]
struct Inner {
    view: CloudView,
    /// サーバーが示した、取りに行くべき画像の版。
    characters_wanted: Option<String>,
    /// 画像の取得の失敗。画像は他の同期と別に、間隔を延ばして取り直す。
    characters_failures: u32,
    characters_next_attempt: Option<Instant>,
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
    characters: CharacterCache,
    /// 版の切り替えと、画像を置く・消すを1つずつ行うためのロック。
    /// 「古い応答ではないか」の確認と、その応答による書き込みを、この中でまとめて行う。
    /// 順番は、このロック → `inner` / 端末の状態。逆の順では取らない。
    edition_lock: Mutex<()>,
    /// デモ版に戻る（ログイン、ログアウト、失効、承認の取り消し）たびに進める番号。
    /// 通信の前に控えておき、戻ってきた応答が古いログインのものなら捨てる。
    /// `Inner` はログアウトで丸ごと作り直すので、その外に置く。
    generation: AtomicU64,
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
    /// `edition` は端末に控えた版。ログインしていなければ、控えによらずデモ版で始める。
    /// トークンを読めなかった（資格情報ストアの一時的なエラー）ときは、ログインしていないとは
    /// 限らないので、控えの版も画像もそのままにする（この起動の間は同期しない）。
    pub fn new(
        base: Option<String>,
        tokens: Box<dyn TokenStore>,
        characters: CharacterCache,
        edition: Edition,
    ) -> Self {
        let loaded = match base {
            Some(_) => tokens.load(),
            None => Ok(None),
        };
        let (token, edition, error) = match loaded {
            Ok(Some(token)) => (Some(token), edition, None),
            Ok(None) => (None, Edition::Demo, None),
            Err(message) => {
                eprintln!("{message}");
                (None, edition, Some(message))
            }
        };
        let characters_version = if edition.is_full() {
            characters.version()
        } else {
            // デモ版の端末に、完全版の画像を残さない。
            if let Err(e) = characters.clear() {
                eprintln!("キャラクターの画像を消せませんでした: {e}");
            }
            None
        };
        let view = CloudView {
            configured: base.is_some(),
            logged_in: token.is_some(),
            edition,
            characters_version,
            error,
            ..CloudView::default()
        };
        Self {
            http: base.as_deref().map(Api::new),
            base,
            tokens,
            characters,
            edition_lock: Mutex::new(()),
            generation: AtomicU64::new(0),
            inner: Mutex::new(Inner {
                view,
                token,
                ..Inner::default()
            }),
            wake: Notify::new(),
        }
    }

    pub fn open(base: Option<String>, characters: CharacterCache, edition: Edition) -> Self {
        let tokens = KeyringStore::new(base.as_deref().unwrap_or(""));
        Self::new(base, Box::new(tokens), characters, edition)
    }

    /// 完全版の画像を1枚。完全版で、端末にそろっているときだけ返す。
    /// そろっているかは、メモリに持っている版（`characters_version`）で判断し、
    /// 画像のたびに10枚の有無をディスクで確かめない。版は、そろえて置いたときと起動時にだけ決まる。
    pub fn character(&self, key: &str) -> Option<Vec<u8>> {
        {
            let inner = self.lock();
            if !inner.view.edition.is_full() || inner.view.characters_version.is_none() {
                return None;
            }
        }
        self.characters.read_image(key)
    }

    fn is_full(&self) -> bool {
        self.lock().view.edition.is_full()
    }

    /// いまのログインの番号。通信の前に控え、`is_current` で照らし合わせる。
    fn generation(&self) -> u64 {
        self.generation.load(Ordering::SeqCst)
    }

    fn is_current(&self, generation: u64) -> bool {
        self.generation() == generation
    }

    /// デモ版に戻す（ログイン、ログアウト、トークンの失効、承認の取り消し）。受け取った画像は消す。
    /// 番号を先に進めるので、通信中の古い応答は、この後に何も書けない。新しい番号を返す。
    fn become_demo(&self, app: &AppHandle) -> u64 {
        let generation = self.generation.fetch_add(1, Ordering::SeqCst) + 1;
        let _guard = self.edition_lock.lock().expect("edition");
        {
            let mut inner = self.lock();
            inner.view.edition = Edition::Demo;
            inner.view.characters_version = None;
            inner.characters_wanted = None;
            inner.characters_failures = 0;
            inner.characters_next_attempt = None;
        }
        if let Err(e) = self.characters.clear() {
            eprintln!("キャラクターの画像を消せませんでした: {e}");
        }
        if let Some(state) = app.try_state::<AppState>() {
            set_edition(app, &state, Edition::Demo);
        }
        generation
    }

    /// 取りに行くべき画像の版。そろっているか、取り直しを待っている間は `None`。
    fn characters_due(&self) -> Option<String> {
        let inner = self.lock();
        let wanted = inner.characters_wanted.as_ref()?;
        if inner
            .characters_next_attempt
            .is_some_and(|until| Instant::now() < until)
        {
            return None;
        }
        (inner.view.characters_version.as_ref() != Some(wanted)).then(|| wanted.clone())
    }

    /// 受け取った画像を置く。`generation` のログインのまま完全版のときだけ置き、置いたかを返す。
    /// 確認と書き込みを `edition_lock` の中で行うので、`become_demo` の消去と入れ違わない。
    fn store_characters(
        &self,
        app: &AppHandle,
        generation: u64,
        version: String,
        images: &[(&str, Vec<u8>)],
    ) -> std::io::Result<bool> {
        let _guard = self.edition_lock.lock().expect("edition");
        if !self.is_current(generation) || !self.is_full() {
            return Ok(false);
        }
        self.characters.store(&version, images)?;
        {
            let mut inner = self.lock();
            inner.view.characters_version = Some(version);
            inner.characters_failures = 0;
            inner.characters_next_attempt = None;
        }
        self.publish(app);
        Ok(true)
    }

    /// 画像を取れなかった。他の同期は止めず、画像だけ間隔を延ばして取り直す。
    fn characters_failed(&self, error: &ApiError) {
        let mut inner = self.lock();
        inner.characters_failures += 1;
        inner.characters_next_attempt = Some(Instant::now() + backoff(inner.characters_failures));
        eprintln!("キャラクターの画像を取れませんでした: {}", error.message());
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
        Some(self.api_with_generation()?.0)
    }

    /// トークンつきのクライアントと、そのトークンのログインの番号。
    /// トークンの差し替え（`on_login`）は、同じロックの中で番号も進めるので、
    /// 古いトークンと新しい番号の組み合わせにはならない。
    fn api_with_generation(&self) -> Option<(Api, u64)> {
        let inner = self.lock();
        let token = inner.token.clone()?;
        let generation = self.generation();
        drop(inner);
        Some((self.http.as_ref()?.with_token(&token), generation))
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
                inner.view.name = None;
                inner.view.image = None;
                drop(inner);
                self.tokens.clear();
                self.become_demo(app);
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

    /// サーバーの内容を端末に取り込み終えた。`generation` は要求を出したときのログインの番号。
    /// 取り込めたら、この後に使う番号を返す（デモ版の応答では番号が進む）。
    /// その後にログアウトなどがあった（古い応答）なら、何も取り込まずに `None` を返す。
    fn after_sync(
        &self,
        app: &AppHandle,
        state: &AppState,
        remote: &SyncResponse,
        first: bool,
        generation: u64,
    ) -> Option<u64> {
        let edition = remote.edition();
        if !edition.is_full() {
            if !self.is_current(generation) {
                return None;
            }
            // デモ版に戻すと番号が進む。この応答の残りは、新しい番号で取り込む。
            let generation = self.become_demo(app);
            return self
                .apply_sync(app, state, remote, first, generation)
                .then_some(generation);
        }
        self.apply_sync(app, state, remote, first, generation)
            .then_some(generation)
    }

    fn apply_sync(
        &self,
        app: &AppHandle,
        state: &AppState,
        remote: &SyncResponse,
        first: bool,
        generation: u64,
    ) -> bool {
        let _guard = self.edition_lock.lock().expect("edition");
        if !self.is_current(generation) {
            return false;
        }
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
        let edition = remote.edition();
        set_edition(app, state, edition);
        {
            let mut inner = self.lock();
            inner.synced = true;
            inner.last_sync = Some(Instant::now());
            inner.view.stage = Some(remote.stage);
            inner.view.flowers = Some(remote.flowers);
            inner.view.edition = edition;
            inner.characters_wanted = remote.characters_version().map(str::to_string);
        }
        self.publish(app);
        true
    }

    fn set_profile(&self, app: &AppHandle, profile: Profile) {
        {
            let mut inner = self.lock();
            inner.view.name = profile.name;
            inner.view.image = profile.image;
        }
        self.publish(app);
    }

    /// 次の一巡で、サーバーの内容（名前と写真を含む）を取り直す。
    fn request_resync(&self) {
        self.lock().last_sync = None;
        self.wake.notify_one();
    }

    /// 進化の反映で分かった段階と花の数を見せる。`generation` のログインのまま完全版のときだけ。
    /// ログアウトは `inner` を作り直してから番号を進めるので、確認と書き込みを同じロックの中で行う。
    fn set_progress_for(&self, app: &AppHandle, progress: Progress, generation: u64) {
        {
            let mut inner = self.lock();
            if !self.is_current(generation) || !inner.view.edition.is_full() {
                return;
            }
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
        // 版はアカウントごと。最初の同期で、このアカウントの版を聞き直す。
        self.become_demo(app);
        {
            let mut inner = self.lock();
            // トークンを差し替えるのと同じロックの中で番号を進める（`api_with_generation` を参照）。
            self.generation.fetch_add(1, Ordering::SeqCst);
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
        self.become_demo(app);
        self.publish(app);
    }

    fn set_error(&self, app: &AppHandle, message: String) {
        self.lock().view.error = Some(message);
        self.publish(app);
    }
}

/// ログイン後の最初の同期。まっさらなアカウントなら、端末のデータを取り込ませる。
/// 取り込めたら、この後に使う番号を返す（古いログインの応答なら `None`）。
async fn initial_sync(
    app: &AppHandle,
    cloud: &Cloud,
    api: &Api,
    state: &AppState,
    generation: u64,
) -> Result<Option<u64>, ApiError> {
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
    Ok(cloud.after_sync(app, state, &remote, true, generation))
}

/// 名前と写真を取り直す。見せるだけのものなので、取れなくても同期は止めない
/// （`/profile` を持たない古いサーバーでも動くように）。ただしトークンの失効は伝える。
async fn refresh_profile(app: &AppHandle, cloud: &Cloud, api: &Api) -> Result<(), ApiError> {
    match api.profile().await {
        Ok(profile) => cloud.set_profile(app, profile),
        Err(ApiError::Unauthorized) => return Err(ApiError::Unauthorized),
        Err(e) => eprintln!("名前と写真を取れませんでした: {}", e.message()),
    }
    Ok(())
}

/// 完全版の画像を1組取り、端末に置く。1枚でも取れなければ、何も置かない。
/// 置いたかを返す。取っている間にデモ版に戻った（番号が変わった）なら、置かずに false。
async fn fetch_characters(
    app: &AppHandle,
    cloud: &Cloud,
    api: &Api,
    version: String,
    generation: u64,
) -> Result<bool, ApiError> {
    // 10枚すべてを同じ版で取る。その版が無くなっていれば（`404`）、置かずに後で取り直す。
    let mut images = Vec::with_capacity(KEYS.len());
    for key in KEYS {
        images.push((key, api.character(key, &version).await?));
    }
    cloud
        .store_characters(app, generation, version, &images)
        .map_err(|e| ApiError::Retry(format!("画像を保存できません: {e}")))
}

/// 送るべきものを順に送る。最初の失敗で止まる。通信をしたかを返す。
/// `generation` は、`api` のトークンを取り出す前に控えたログインの番号。
/// デモ版の応答を取り込むと番号が進むので、そのときは新しい番号に書き換える
/// （呼び出し元は、失敗がいまのログインのものかを、この番号で見分ける）。
async fn sync_once(
    app: &AppHandle,
    cloud: &Cloud,
    api: &Api,
    state: &AppState,
    generation: &mut u64,
) -> Result<bool, ApiError> {
    let mut did = false;
    if !cloud.is_synced() {
        let Some(accepted) = initial_sync(app, cloud, api, state, *generation).await? else {
            return Ok(false);
        };
        *generation = accepted;
        did = true;
    } else if cloud.resync_due() {
        let remote = api.sync().await?;
        let Some(accepted) = cloud.after_sync(app, state, &remote, false, *generation) else {
            return Ok(false);
        };
        *generation = accepted;
        did = true;
    }
    if did {
        refresh_profile(app, cloud, api).await?;
    }
    // 画像は他の同期と別に取り直す。取れなくても、記録や設定の送信は止めない
    // （ただしトークンの失効は、ほかと同じくデモ版に戻す）。
    // 画像が 403 なら、承認が取り消されている。ログインは残したまま、すぐにデモ版に戻して画像を消す。
    if let Some(version) = cloud.characters_due() {
        match fetch_characters(app, cloud, api, version, *generation).await {
            Ok(true) => did = true,
            // 古いログインになった。この回の残り（設定、記録、ライブ状況）は送らない。
            Ok(false) => return Ok(false),
            Err(ApiError::Unauthorized) => return Err(ApiError::Unauthorized),
            Err(ApiError::Forbidden) if cloud.is_current(*generation) => {
                *generation = cloud.become_demo(app);
            }
            Err(e) => cloud.characters_failed(&e),
        }
    }

    // ここから先は、いまのログインのときだけ送る（古いトークンで別のアカウントに書かない）。
    if !cloud.is_current(*generation) {
        return Ok(false);
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

    if !cloud.is_current(*generation) {
        return Ok(false);
    }
    let snapshot = state.snapshot();
    let days = wire::days_body(&snapshot.view.status);
    let key = days.to_string();
    if cloud.days_changed(&key) {
        api.put_days(&days).await?;
        cloud.lock().last_days = key;
        did = true;
    }

    // デモ版では進化を反映しない。保留は残し、完全版になってから反映する。
    // 1つずつ取り出す前と、反映を端末に書く前に、同じログインのまま完全版かを確かめ直す
    // （途中でログアウトや承認の取り消しがあれば、そこで止める）。
    let accepted = *generation;
    let still_full = || cloud.is_current(accepted) && cloud.is_full();
    if snapshot.view.pending_evolutions > 0 && still_full() {
        let progress = cloud.known_progress(snapshot.progress);
        let host = Evolutions {
            app,
            state,
            active: &still_full,
        };
        let outcome = apply_pending(&host, api, progress).await;
        cloud.set_progress_for(app, outcome.progress, accepted);
        did |= outcome.applied > 0;
        match outcome.error {
            None => {}
            // 承認が取り消されていた。保留は戻してあるので、デモ版に戻して続ける。
            Some(ApiError::Forbidden) if cloud.is_current(accepted) => {
                *generation = cloud.become_demo(app);
            }
            Some(error) => return Err(error),
        }
    }

    if !cloud.is_current(*generation) {
        return Ok(false);
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
    // トークンと、そのトークンのログインの番号を一緒に取る。後でログインし直していれば、応答を捨てられる。
    let Some((api, mut generation)) = cloud.api_with_generation() else {
        return;
    };
    if cloud.backing_off() {
        return;
    }
    let state = app.state::<AppState>();
    match sync_once(app, cloud, &api, &state, &mut generation).await {
        Ok(true) => cloud.succeeded(app),
        Ok(false) => {}
        // 古いログインのトークンでの失敗（401 など）で、いまのログインを消したりデモ版にしたりしない。
        Err(_) if !cloud.is_current(generation) => {}
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

    let characters = app
        .path()
        .app_data_dir()
        .map(|dir| CharacterCache::new(dir.join("characters")))
        .expect("アプリのデータフォルダーが決まる");
    let state = app.state::<AppState>();
    let cloud = Cloud::open(base_url(), characters, state.edition());
    // ログインしていなければデモ版。控えの版と食い違っていれば、合わせる。
    set_edition(app.handle(), &state, cloud.view().edition);
    app.manage(cloud);

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

/// `character://` の応答。完全版で、画像がそろっているときだけ返す。
/// WebView に残さないよう、キャッシュさせない。
pub fn character_response(app: &AppHandle, path: &str) -> tauri::http::Response<Vec<u8>> {
    use tauri::http::{Response, StatusCode, header};
    let image = app
        .try_state::<Cloud>()
        .and_then(|cloud| cloud.character(crate::characters::key_from_path(path)));
    let builder = Response::builder().header(header::CACHE_CONTROL, "no-store");
    match image {
        Some(bytes) => builder
            .header(header::CONTENT_TYPE, "image/png")
            .body(bytes),
        None => builder.status(StatusCode::NOT_FOUND).body(Vec::new()),
    }
    .expect("応答を組み立てられる")
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

    /// 読み出しの結果を決めておける、トークンの保管の代わり。
    struct FakeTokens(Result<Option<String>, String>);

    impl TokenStore for FakeTokens {
        fn load(&self) -> Result<Option<String>, String> {
            self.0.clone()
        }
        fn save(&self, _: &str) -> Result<(), String> {
            Ok(())
        }
        fn clear(&self) {}
    }

    const PNG: &[u8] = b"\x89PNG\r\n\x1a\nrest";

    /// 完全版の画像（版 v1）を置いた端末で、`Cloud` を作る。
    fn start(
        dir: &tempfile::TempDir,
        loaded: Result<Option<String>, String>,
        edition: Edition,
    ) -> Cloud {
        let cache = CharacterCache::new(dir.path().join("characters"));
        let images: Vec<_> = KEYS.iter().map(|key| (*key, PNG.to_vec())).collect();
        cache.store("v1", &images).unwrap();
        Cloud::new(
            Some("http://localhost:5173".into()),
            Box::new(FakeTokens(loaded)),
            cache,
            edition,
        )
    }

    #[test]
    fn ログイン済みの完全版は_控えの版と画像のまま始まる() {
        let dir = tempfile::tempdir().unwrap();
        let cloud = start(&dir, Ok(Some("token".into())), Edition::Full);
        let view = cloud.view();
        assert!(view.logged_in);
        assert_eq!(view.edition, Edition::Full);
        assert_eq!(view.characters_version.as_deref(), Some("v1"));
        assert_eq!(cloud.character("stage0").as_deref(), Some(PNG));
    }

    #[test]
    fn ログインしていなければ_デモ版で始まり_画像を消す() {
        let dir = tempfile::tempdir().unwrap();
        let cloud = start(&dir, Ok(None), Edition::Full);
        let view = cloud.view();
        assert!(!view.logged_in);
        assert_eq!(view.edition, Edition::Demo);
        assert_eq!(view.characters_version, None);
        assert_eq!(cloud.character("stage0"), None);
        assert!(!dir.path().join("characters").exists());
    }

    #[test]
    fn トークンを読めなかっただけなら_控えの版と画像を残す() {
        let dir = tempfile::tempdir().unwrap();
        let cloud = start(&dir, Err("一時的なエラー".into()), Edition::Full);
        let view = cloud.view();
        assert!(!view.logged_in);
        assert_eq!(view.edition, Edition::Full);
        assert_eq!(view.characters_version.as_deref(), Some("v1"));
        assert_eq!(view.error.as_deref(), Some("一時的なエラー"));
        assert_eq!(cloud.character("stage0").as_deref(), Some(PNG));
    }

    #[test]
    fn デモ版の控えなら_ログイン済みでも画像を残さない() {
        let dir = tempfile::tempdir().unwrap();
        let cloud = start(&dir, Ok(Some("token".into())), Edition::Demo);
        assert_eq!(cloud.view().edition, Edition::Demo);
        assert_eq!(cloud.character("stage0"), None);
        assert!(!dir.path().join("characters").exists());
    }

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

/// サーバーの内容を今すぐ取り直す（アカウント画面を開いたとき。サイトで変えた名前と写真を出すため）。
#[tauri::command]
pub fn refresh_cloud(cloud: tauri::State<Cloud>) {
    cloud.request_resync();
}
