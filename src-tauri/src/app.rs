//! Tauri との接続。ドメインを毎秒動かし、状態を WebView に流し、保存する。
//! ここは時計と OS に触れる層で、規則はすべて `domain` と `settings` にある。

use std::sync::Mutex;
use std::time::Duration;

use chrono::{Local, NaiveDateTime, TimeZone, Timelike};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::cloud_input;
use crate::domain::effects::{Effect, Notice, Sound};
use crate::domain::engine::view::View;
use crate::domain::engine::{Engine, StartError};
use crate::domain::growth::{Evolution, Flower, evolve};
use crate::domain::restrictions::RestrictionsForm;
use crate::domain::timer::TimerKind;
use crate::settings::{Settings, Speakers, Use};
use crate::storage::{Progress, Saved, Store, StoreError, backup_text};
use crate::{player, shortcut, speech};

/// 状態を書き出す間隔（tick の回数）。コマンドや通知が起きたときは、その場で書く。
const SAVE_EVERY_TICKS: u32 = 10;

pub struct AppState {
    saved: Mutex<Saved>,
    store: Store,
    /// 新しい版のファイルを古いアプリで上書きしないための印。
    persist: bool,
}

fn local_now() -> NaiveDateTime {
    Local::now().naive_local()
}

fn to_epoch_ms(dt: NaiveDateTime) -> i64 {
    Local
        .from_local_datetime(&dt)
        .earliest()
        .map_or(0, |dt| dt.timestamp_millis())
}

impl AppState {
    pub fn open(store: Store, now: NaiveDateTime) -> Self {
        let fresh = || Saved {
            engine: Engine::new(now),
            settings: Settings::default(),
            progress: None,
        };
        let (saved, persist) = match store.load() {
            Ok(Some(saved)) => (saved, true),
            Ok(None) => (fresh(), true),
            Err(e @ StoreError::UnsupportedVersion { .. }) => {
                eprintln!("{e}。保存せずに起動します");
                (fresh(), false)
            }
            Err(e) => {
                eprintln!("{e}。新しい状態で起動します");
                (fresh(), true)
            }
        };
        Self {
            saved: Mutex::new(saved),
            store,
            persist,
        }
    }

    /// 用途に合う出力先の名前。空文字は既定のスピーカー。
    pub fn speaker(&self, use_: Use) -> String {
        self.saved
            .lock()
            .expect("saved")
            .settings
            .speakers
            .device(use_)
            .to_string()
    }

    pub fn speak_volume(&self) -> u8 {
        self.saved.lock().expect("saved").settings.speak_volume
    }

    pub fn speak_shortcut(&self) -> String {
        self.saved
            .lock()
            .expect("saved")
            .settings
            .speak_shortcut
            .clone()
    }

    /// いま画面に出ている内容を、読み上げる文にする。
    pub fn speech_text(&self) -> String {
        let view = self
            .saved
            .lock()
            .expect("saved")
            .engine
            .view(local_now(), &to_epoch_ms);
        speech::text_for(
            &view.status.phase,
            &view.status.label,
            view.status.remaining_sec,
            view.ended_by,
        )
    }

    fn save(&self, saved: &Saved) {
        if !self.persist {
            return;
        }
        if let Err(e) = self.store.save(saved) {
            eprintln!("{e}");
        }
    }
}

/// ドメインが返した「すべきこと」を実行する。ウィンドウとトーストは `windows`、
/// 音は後の手順で足す。
fn dispatch(app: &AppHandle, effects: &[Effect]) {
    for effect in effects {
        let _ = app.emit("effect", effect);
    }
    crate::windows::handle_effects(app, effects);
}

fn publish(app: &AppHandle, view: &View) {
    let _ = app.emit("view", view);
}

/// 状態を変える操作を1回行い、保存して、新しい状態を流す。
fn operate<T>(
    app: &AppHandle,
    state: &AppState,
    action: impl FnOnce(&mut Saved, NaiveDateTime) -> (Vec<Effect>, T),
) -> (View, T) {
    let now = local_now();
    let mut saved = state.saved.lock().expect("saved");
    let (effects, result) = action(&mut saved, now);
    let view = saved.engine.view(now, &to_epoch_ms);
    state.save(&saved);
    drop(saved);
    dispatch(app, &effects);
    publish(app, &view);
    (view, result)
}

#[tauri::command]
pub fn get_view(state: State<AppState>) -> View {
    let now = local_now();
    state
        .saved
        .lock()
        .expect("saved")
        .engine
        .view(now, &to_epoch_ms)
}

/// `seconds` が空か不正なら、設定の既定時間を使う。
#[tauri::command]
pub fn start_timer(
    app: AppHandle,
    state: State<AppState>,
    kind: String,
    seconds: Option<i64>,
) -> Result<View, String> {
    let kind = match kind.as_str() {
        "play" => TimerKind::Play,
        "break" => TimerKind::Break,
        other => return Err(format!("不明な種類です: {other}")),
    };
    let (view, result) = operate(&app, &state, |saved, now| {
        let Some(secs) = saved.settings.resolve(kind, seconds) else {
            return (Vec::new(), Err(StartError::InvalidDuration.message()));
        };
        match saved
            .engine
            .start_timer(kind, chrono::Duration::seconds(secs), now)
        {
            Ok(effects) => (effects, Ok(())),
            Err(e) => (Vec::new(), Err(e.message())),
        }
    });
    result.map(|()| view)
}

#[tauri::command]
pub fn pause_timer(app: AppHandle, state: State<AppState>) -> View {
    operate(&app, &state, |saved, now| {
        saved.engine.pause(now);
        (Vec::new(), ())
    })
    .0
}

#[tauri::command]
pub fn resume_timer(app: AppHandle, state: State<AppState>) -> View {
    operate(&app, &state, |saved, now| {
        saved.engine.resume(now);
        (Vec::new(), ())
    })
    .0
}

#[tauri::command]
pub fn press_stopped(app: AppHandle, state: State<AppState>) -> View {
    operate(&app, &state, |saved, now| {
        (saved.engine.press_stopped(now), ())
    })
    .0
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsView {
    pub play_secs: Option<i64>,
    pub break_secs: Option<i64>,
    pub notify20: bool,
    pub speakers: Speakers,
    pub speak_shortcut: String,
    pub speak_volume: u8,
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> SettingsView {
    let saved = state.saved.lock().expect("saved");
    SettingsView {
        play_secs: saved.settings.play_secs,
        break_secs: saved.settings.break_secs,
        notify20: saved.engine.notify20(),
        speakers: saved.settings.speakers.clone(),
        speak_shortcut: saved.settings.speak_shortcut.clone(),
        speak_volume: saved.settings.speak_volume,
    }
}

/// 設定を保存し、読み上げのショートカットを付け替える。
/// ショートカットを登録できなくても設定は保存する（そのときだけエラーを返す）。
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn save_settings(
    app: AppHandle,
    state: State<AppState>,
    play_secs: Option<i64>,
    break_secs: Option<i64>,
    notify20: bool,
    speakers: Speakers,
    speak_shortcut: String,
    speak_volume: u8,
) -> Result<(), String> {
    operate(&app, &state, |saved, _| {
        saved.settings = Settings {
            speakers,
            speak_shortcut: speak_shortcut.clone(),
            speak_volume: speak_volume.min(100),
            ..Settings::new(play_secs, break_secs)
        };
        saved.engine.set_notify20(notify20);
        (Vec::new(), ())
    });
    shortcut::apply(&app, &speak_shortcut)
}

/// 設定画面の「テスト」。いまの残り時間を、指定の音量で読み上げる。
#[tauri::command]
pub fn speak_now(app: AppHandle, volume: u8) {
    player::speak_remaining(&app, Some(volume.min(100)));
}

/// 選べる出力先の名前。COM の初期化が WebView と競合しないよう、async でメインスレッドを避ける。
#[tauri::command]
pub async fn list_outputs() -> Result<Vec<String>, String> {
    crate::audio_out::list_outputs()
}

/// 設定画面のテスト再生。`purpose` は `play` / `break` / `notify` / `shared`。
#[tauri::command]
pub async fn test_sound(purpose: String, device: String) -> Result<(), String> {
    let use_ = match purpose.as_str() {
        "play" => Use::Play,
        "break" => Use::Break,
        "notify" => Use::Notify,
        _ => Use::Shared,
    };
    crate::player::test(use_, &device)
}

/// 制限時刻のアラームが鳴り終わった。前面の固定を外してよいか、ドメインが決める。
pub(crate) fn finish_alarm(app: &AppHandle) {
    let state = app.state::<AppState>();
    operate(app, &state, |saved, now| {
        (saved.engine.alarm_finished(now), ())
    });
}

#[tauri::command]
pub fn get_restrictions(state: State<AppState>) -> RestrictionsForm {
    let saved = state.saved.lock().expect("saved");
    saved.engine.restrictions().into()
}

#[tauri::command]
pub fn save_restrictions(app: AppHandle, state: State<AppState>, form: RestrictionsForm) {
    operate(&app, &state, |saved, now| {
        // 書き換えただけで境界を通過したとはみなさず、閉じられるかどうかだけ切り替える。
        (saved.engine.edit_restrictions((&form).into(), now), ())
    });
}

/// 別の端末で変えたスタート制限を取り込む。利用者の操作ではないので、閉じられるかどうかは変えない。
#[tauri::command]
pub fn apply_cloud_restrictions(app: AppHandle, state: State<AppState>, form: RestrictionsForm) {
    operate(&app, &state, |saved, now| {
        saved.engine.set_restrictions((&form).into(), now);
        (Vec::new(), ())
    });
}

/// 開花の抽選に使う 0以上100未満の値。
fn random_roll() -> f64 {
    use std::hash::{BuildHasher, Hasher};
    let bits = std::collections::hash_map::RandomState::new()
        .build_hasher()
        .finish();
    (bits % 10_000) as f64 / 100.0
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EvolutionPlan {
    /// 成長したときの新しい段階。開花のときは `None`（0 に戻る）。
    stage: Option<u32>,
    flower: Option<Flower>,
    /// 開花で増える花の数。
    gain: u32,
}

/// 保留中の進化を1つ取り出す。取り出せたら true。
#[tauri::command]
pub fn take_evolution(app: AppHandle, state: State<AppState>) -> bool {
    operate(&app, &state, |saved, _| {
        (Vec::new(), saved.engine.take_pending_evolution())
    })
    .1
}

/// 反映できなかった進化を保留に戻す。
#[tauri::command]
pub fn restore_evolution(app: AppHandle, state: State<AppState>) {
    operate(&app, &state, |saved, _| {
        saved.engine.restore_pending_evolution();
        (Vec::new(), ())
    });
}

/// 現在の進化段階から、次に起きること（成長か開花）を決める。状態は変えない。
#[tauri::command]
pub fn plan_evolution(current: u32) -> EvolutionPlan {
    match evolve(current, random_roll()) {
        Evolution::Grew { stage } => EvolutionPlan {
            stage: Some(stage),
            flower: None,
            gain: 0,
        },
        Evolution::Bloomed { flower } => EvolutionPlan {
            stage: None,
            flower: Some(flower),
            gain: flower.gain(),
        },
    }
}

/// クラウドへ反映できた進化を、利用者に知らせる。開花なら今日の花を覚える。
#[tauri::command]
pub fn commit_evolution(app: AppHandle, state: State<AppState>, flower: Option<Flower>) {
    operate(&app, &state, |saved, now| {
        let notice = match flower {
            Some(flower) => {
                saved.engine.set_bloom(flower, now);
                Notice::Bloomed { flower }
            }
            None => Notice::Evolved,
        };
        (
            vec![Effect::Notice(notice), Effect::Sound(Sound::Evolved)],
            (),
        )
    });
}

/// クラウドの記録のうち、この端末に無いものを取り込む。
#[tauri::command]
pub fn import_cloud(
    app: AppHandle,
    state: State<AppState>,
    stats: Option<serde_json::Value>,
    history: Option<serde_json::Value>,
) -> View {
    let stats = cloud_input::parse_stats(stats.as_ref());
    let history = cloud_input::parse_history(history.as_ref());
    operate(&app, &state, |saved, now| {
        saved.engine.import_cloud(stats, &history, now);
        (Vec::new(), ())
    })
    .0
}

/// クラウドから読めた進化段階と花の数を、控えとして保存する。変わったときだけ書く。
/// クラウドを移すとき（`docs/plan/void-migration.md`）に、新しい保存先へ運ぶため。
#[tauri::command]
pub fn mirror_progress(state: State<AppState>, stage: u32, flowers: u32) {
    let mut saved = state.saved.lock().expect("saved");
    let next = Progress { stage, flowers };
    if saved.progress == Some(next) {
        return;
    }
    saved.progress = Some(next);
    state.save(&saved);
}

/// 保存内容を、ダウンロードフォルダーにファイルとして書き出す。移行前の保険。
/// 書いたファイルの場所を返す。
#[tauri::command]
pub fn export_backup(app: AppHandle, state: State<AppState>) -> Result<String, String> {
    let text = {
        let saved = state.saved.lock().expect("saved");
        backup_text(&saved).map_err(|e| e.to_string())?
    };
    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().app_data_dir())
        .map_err(|e| format!("書き出し先を決められません: {e}"))?;
    let name = format!("kumamorun-backup-{}.json", Local::now().format("%Y-%m-%d"));
    let path = dir.join(name);
    std::fs::write(&path, text).map_err(|e| format!("書き出せません: {e}"))?;
    Ok(path.display().to_string())
}

/// 毎秒、ドメインを進める。WebView が隠れていても止まらない。
fn tick_loop(app: AppHandle) {
    let mut ticks: u32 = 0;
    loop {
        // 次の秒の頭まで待つ。
        let into_second = local_now().nanosecond() % 1_000_000_000;
        std::thread::sleep(Duration::from_nanos(u64::from(1_000_000_000 - into_second)));

        let state = app.state::<AppState>();
        let now = local_now();
        let mut saved = state.saved.lock().expect("saved");
        let effects = saved.engine.tick(now);
        let view = saved.engine.view(now, &to_epoch_ms);
        ticks = ticks.wrapping_add(1);
        if !effects.is_empty() || ticks.is_multiple_of(SAVE_EVERY_TICKS) {
            state.save(&saved);
        }
        drop(saved);
        dispatch(&app, &effects);
        publish(&app, &view);
    }
}

pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let dir = app.path().app_data_dir()?;
    let state = AppState::open(Store::new(dir.join("state.json")), local_now());
    app.manage(state);
    app.manage(crate::windows::WindowState::default());
    let accelerator = app.state::<AppState>().speak_shortcut();
    if let Err(e) = shortcut::apply(app.handle(), &accelerator) {
        eprintln!("読み上げのショートカットを登録できませんでした: {e}");
    }
    crate::windows::setup_tray(app)?;
    // 自動起動（--hidden）のときはトレイに隠したまま始める。
    if !std::env::args().any(|arg| arg == "--hidden") {
        crate::windows::show_main(app.handle());
    }
    crate::desktop::start(app.handle().clone());
    let handle = app.handle().clone();
    std::thread::spawn(move || tick_loop(handle));
    Ok(())
}
