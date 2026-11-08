//! ウィンドウ、トレイ、トーストの実操作。ここは OS に触れる層で、
//! 何をするか（固定の方針、配置の計算、カーソルの判定）は `pin` と `toast` が決める。

use std::sync::Mutex;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, State, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Window, WindowEvent,
};
use tauri_plugin_autostart::ManagerExt;

use crate::domain::effects::Effect;
use crate::notices::toast_text;
use crate::pin::{CloseDecision, Pin, PinAction};
use crate::toast::{
    CardBox, CardRect, Pad, PlaceOptions, Rect, Size, card_at, nudge_bounds, place_toast_window,
};

const MAIN: &str = "main";
const MINI: &str = "mini";
const TOAST: &str = "toast";

/// ミニウィンドウの大きさ（論理 px）。
const MINI_WIDTH: f64 = 240.0;
const MINI_HEIGHT: f64 = 100.0;
const MINI_EDGE: f64 = 24.0;

/// トーストが出ている間にカーソルを見る間隔。出ていない間は見ない。
const CURSOR_POLL: Duration = Duration::from_millis(40);
const IDLE_POLL: Duration = Duration::from_millis(250);

#[derive(Debug, Clone, Serialize)]
struct ToastPayload {
    title: String,
    body: String,
}

#[derive(Default)]
struct ToastRuntime {
    /// トースト窓の画面が読み込まれ、受け取れる状態か。
    ready: bool,
    /// 画面の準備前に届いた分。
    queue: Vec<ToastPayload>,
    /// 画面が測ったカードの範囲。
    cards: Vec<CardRect>,
    hovered: Option<u32>,
    visible: bool,
    watcher_started: bool,
}

#[derive(Default)]
pub struct WindowState {
    pin: Mutex<Pin>,
    mini_pos: Mutex<Option<PhysicalPosition<i32>>>,
    toast: Mutex<ToastRuntime>,
}

// ---- メインウィンドウ ----

pub fn show_main(app: &AppHandle) {
    crate::desktop::wake();
    if let Some(window) = app.get_webview_window(MAIN) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn hide_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN) {
        let _ = window.set_always_on_top(false);
        let _ = window.unminimize();
        let _ = window.hide();
    }
}

/// 隠れていても最小化されていても見えるようにし、閉じられない最前面にする。
/// 他のアプリが全画面でも、その上に出す（排他的全画面のゲームは除く）。
fn show_pinned(window: &WebviewWindow) {
    let _ = window.unminimize();
    let _ = window.set_minimizable(false);
    let _ = window.show();
    let _ = window.set_always_on_top(true);
    let _ = window.set_focus();
}

fn apply_pin(app: &AppHandle, actions: &[PinAction]) {
    for action in actions {
        match action {
            PinAction::CloseMini => {
                if let Some(mini) = app.get_webview_window(MINI) {
                    // 閉じたときにメインを戻す処理が走るので、先にメインの固定へ進める。
                    let _ = mini.close();
                }
            }
            PinAction::ShowPinned => {
                if let Some(main) = app.get_webview_window(MAIN) {
                    show_pinned(&main);
                }
            }
            PinAction::Unpin => {
                if let Some(main) = app.get_webview_window(MAIN) {
                    let _ = main.set_fullscreen(false);
                    let _ = main.set_minimizable(true);
                    let _ = main.set_always_on_top(false);
                }
                // 集中モードの画面を閉じる合図。
                let _ = app.emit("focus-closed", ());
            }
        }
    }
}

/// ドメインが返した「すべきこと」を実行する。
pub fn handle_effects(app: &AppHandle, effects: &[Effect]) {
    let state = app.state::<WindowState>();
    for effect in effects {
        match effect {
            Effect::Surface(surface) => {
                let actions = state.pin.lock().expect("pin").surface(*surface);
                apply_pin(app, &actions);
            }
            Effect::ReleaseAlwaysOnTop { force } => {
                let actions = state.pin.lock().expect("pin").release(*force);
                apply_pin(app, &actions);
            }
            Effect::Notice(notice) => {
                let text = toast_text(*notice);
                present_toast(
                    app,
                    ToastPayload {
                        title: text.title,
                        body: text.body,
                    },
                );
            }
            Effect::Sound(sound) => crate::player::play(app, *sound),
            // 戻るのは復帰した後なので、tick を止めないよう別スレッドで呼ぶ。
            Effect::SleepNow => {
                std::thread::spawn(|| {
                    if let Err(e) = crate::winapi::sleep_now() {
                        eprintln!("{e}");
                    }
                });
            }
        }
    }
}

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    let app = window.app_handle();
    let state = app.state::<WindowState>();
    match (window.label(), event) {
        // 閉じてもアプリは終了せず、トレイに隠して裏で動かし続ける。
        (MAIN, WindowEvent::CloseRequested { api, .. }) => {
            let decision = state.pin.lock().expect("pin").on_close_requested();
            match decision {
                CloseDecision::Allow => {}
                CloseDecision::Hide => {
                    api.prevent_close();
                    hide_main(app);
                }
                CloseDecision::KeepVisible => {
                    api.prevent_close();
                    apply_pin(app, &[PinAction::ShowPinned]);
                }
            }
        }
        // 最小化を禁止していても Win+↓ などで最小化できることがあるので、すぐ戻す。
        (MAIN, WindowEvent::Resized(_)) => {
            if window.is_minimized().unwrap_or(false) {
                if let Some(action) = state.pin.lock().expect("pin").on_minimized() {
                    apply_pin(app, &[action]);
                }
            }
        }
        (MINI, WindowEvent::Moved(position)) => {
            *state.mini_pos.lock().expect("mini_pos") = Some(*position);
        }
        // ミニを閉じたら（✕でも Alt+F4 でも）必ずメインへ戻す。
        (MINI, WindowEvent::Destroyed) => {
            if !state.pin.lock().expect("pin").is_quitting() {
                show_main(app);
            }
        }
        _ => {}
    }
}

/// 更新を入れ終わったあとの再起動。閉じる操作を止める仕組みを外してから再起動する。
pub fn quit_for_restart(app: &AppHandle) {
    app.state::<WindowState>()
        .pin
        .lock()
        .expect("pin")
        .quitting();
    app.restart();
}

pub fn quit(app: &AppHandle) {
    app.state::<WindowState>()
        .pin
        .lock()
        .expect("pin")
        .quitting();
    app.exit(0);
}

// ---- トレイ ----

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 自動起動は開発ビルドでは使えない（開発用の実行ファイルを登録してしまうため）。
    let dev = cfg!(debug_assertions);
    let autostart = CheckMenuItemBuilder::with_id(
        "autostart",
        if dev {
            "PC起動時に自動で起動（開発ビルドでは使えません）"
        } else {
            "PC起動時に自動で起動（バックグラウンド）"
        },
    )
    .enabled(!dev)
    .checked(app.autolaunch().is_enabled().unwrap_or(false))
    .build(app)?;
    let menu = MenuBuilder::new(app)
        .item(&MenuItemBuilder::with_id("show", "表示").build(app)?)
        .item(&autostart)
        .separator()
        .item(&MenuItemBuilder::with_id("quit", "終了").build(app)?)
        .build()?;
    let mut tray = TrayIconBuilder::new()
        .tooltip("Kumamorun")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => show_main(app),
            "autostart" => {
                // メニューは押した時点で表示が切り替わるので、その値を実際の登録に反映する。
                let wanted = autostart.is_checked().unwrap_or(false);
                let launcher = app.autolaunch();
                let result = if wanted {
                    launcher.enable()
                } else {
                    launcher.disable()
                };
                if let Err(e) = result {
                    eprintln!("自動起動を切り替えられませんでした: {e}");
                    let _ = autostart.set_checked(!wanted);
                }
            }
            "quit" => quit(app),
            _ => {}
        })
        // ダブルクリックで表示する。
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick { .. } = event {
                show_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

// ---- ミニ ----

fn physical_rect(rect: &tauri::PhysicalRect<i32, u32>) -> Rect {
    Rect {
        x: f64::from(rect.position.x),
        y: f64::from(rect.position.y),
        width: f64::from(rect.size.width),
        height: f64::from(rect.size.height),
    }
}

fn open_mini_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(mini) = app.get_webview_window(MINI) {
        return mini.show();
    }
    crate::desktop::wake();
    let state = app.state::<WindowState>();
    let remembered = *state.mini_pos.lock().expect("mini_pos");
    let monitor = app.primary_monitor()?;
    let scale = monitor.as_ref().map_or(1.0, |m| m.scale_factor());
    // 既定の位置は作業領域の右下（タスクバーを避ける）。
    let (x, y) = match (remembered, monitor.as_ref()) {
        (Some(position), _) => (f64::from(position.x), f64::from(position.y)),
        (None, Some(monitor)) => {
            let work = physical_rect(monitor.work_area());
            (
                work.x + work.width - (MINI_WIDTH + MINI_EDGE) * scale,
                work.y + work.height - (MINI_HEIGHT + MINI_EDGE) * scale,
            )
        }
        (None, None) => (100.0, 100.0),
    };
    let mini = WebviewWindowBuilder::new(app, MINI, WebviewUrl::App("index.html".into()))
        .title("Kumamorun")
        .inner_size(MINI_WIDTH, MINI_HEIGHT)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(false)
        .build()?;
    mini.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32))?;
    mini.show()
}

/// Windows では、同期コマンドの中でウィンドウを作ると固まるので async にしている。
#[tauri::command]
pub async fn open_mini(app: AppHandle) {
    // 時間切れの固定中は、ミニへ切り替えない。
    if !app
        .state::<WindowState>()
        .pin
        .lock()
        .expect("pin")
        .mini_allowed()
    {
        return;
    }
    if open_mini_window(&app).is_ok() {
        hide_main(&app);
    }
}

#[tauri::command]
pub fn close_mini(app: AppHandle) {
    if let Some(mini) = app.get_webview_window(MINI) {
        let _ = mini.close();
    }
}

// ---- 集中モード ----

#[tauri::command]
pub fn set_focus_mode(app: AppHandle, on: bool) {
    if let Some(main) = app.get_webview_window(MAIN) {
        let _ = main.set_fullscreen(on);
    }
}

// ---- トースト ----

fn ensure_toast_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    if let Some(window) = app.get_webview_window(TOAST) {
        return Ok(window);
    }
    let window = WebviewWindowBuilder::new(app, TOAST, WebviewUrl::App("index.html".into()))
        .title("Kumamorun")
        .inner_size(600.0, 280.0)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .focusable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .visible(false)
        .build()?;
    // カードの外は下のアプリへクリックを通す。カードの上にカーソルが来たときだけ掴む。
    window.set_ignore_cursor_events(true)?;
    start_cursor_watcher(app);
    Ok(window)
}

fn present_toast(app: &AppHandle, payload: ToastPayload) {
    // 呼び出し元が同期コマンドでも固まらないよう、別スレッドで窓を作る。
    let app = app.clone();
    std::thread::spawn(move || {
        if ensure_toast_window(&app).is_err() {
            return;
        }
        let state = app.state::<WindowState>();
        let mut toast = state.toast.lock().expect("toast");
        if toast.ready {
            drop(toast);
            let _ = app.emit_to(TOAST, "toast", payload);
        } else {
            toast.queue.push(payload);
        }
    });
}

#[tauri::command]
pub fn toast_ready(app: AppHandle, state: State<WindowState>) {
    let queued = {
        let mut toast = state.toast.lock().expect("toast");
        toast.ready = true;
        std::mem::take(&mut toast.queue)
    };
    for payload in queued {
        let _ = app.emit_to(TOAST, "toast", payload);
    }
}

/// 画面が測ったトーストの大きさと、カードごとの範囲（CSS px）。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToastLayout {
    width: f64,
    height: f64,
    count: usize,
    pad_top: f64,
    pad_right: f64,
    pad_bottom: f64,
    pad_left: f64,
    card_left: f64,
    card_top: f64,
    card_right: f64,
    card_bottom: f64,
    cards: Vec<CardRect>,
}

#[tauri::command]
pub fn toast_layout(app: AppHandle, state: State<WindowState>, layout: ToastLayout) {
    let Some(window) = app.get_webview_window(TOAST) else {
        return;
    };
    if layout.count < 1 {
        let mut toast = state.toast.lock().expect("toast");
        toast.cards.clear();
        toast.hovered = None;
        toast.visible = false;
        drop(toast);
        let _ = window.hide();
        let _ = window.set_ignore_cursor_events(true);
        return;
    }
    let Ok(Some(primary)) = app.primary_monitor() else {
        return;
    };
    let scale = primary.scale_factor();
    let displays: Vec<Rect> = app
        .available_monitors()
        .unwrap_or_default()
        .iter()
        .map(|monitor| Rect {
            x: f64::from(monitor.position().x),
            y: f64::from(monitor.position().y),
            width: f64::from(monitor.size().width),
            height: f64::from(monitor.size().height),
        })
        .collect();
    let display_bounds = Rect {
        x: f64::from(primary.position().x),
        y: f64::from(primary.position().y),
        width: f64::from(primary.size().width),
        height: f64::from(primary.size().height),
    };
    let placed = place_toast_window(
        physical_rect(primary.work_area()),
        Size {
            width: layout.width * scale,
            height: layout.height * scale,
        },
        PlaceOptions {
            pad: Pad {
                top: layout.pad_top * scale,
                right: layout.pad_right * scale,
                bottom: layout.pad_bottom * scale,
                left: layout.pad_left * scale,
            },
            card: Some(CardBox {
                x: layout.card_left * scale,
                y: layout.card_top * scale,
                right: layout.card_right * scale,
                bottom: layout.card_bottom * scale,
            }),
            display_bounds,
            displays,
        },
    );
    let requested = Rect {
        x: placed.x,
        y: placed.y,
        width: placed.width,
        height: placed.height,
    };
    set_bounds(&window, requested);
    // OS が数 px ずらすことがあるので、同じ分だけ足して要求した位置に戻す。
    if let (Ok(position), Ok(size)) = (window.outer_position(), window.outer_size()) {
        let actual = Rect {
            x: f64::from(position.x),
            y: f64::from(position.y),
            width: f64::from(size.width),
            height: f64::from(size.height),
        };
        if actual != requested {
            set_bounds(&window, nudge_bounds(requested, actual));
        }
    }

    let first = {
        let mut toast = state.toast.lock().expect("toast");
        toast.cards = layout.cards;
        let first = !toast.visible;
        toast.visible = true;
        first
    };
    if first {
        let _ = window.set_always_on_top(true);
        let _ = window.show();
    }
}

fn set_bounds(window: &WebviewWindow, rect: Rect) {
    let _ = window.set_position(PhysicalPosition::new(rect.x as i32, rect.y as i32));
    let _ = window.set_size(PhysicalSize::new(rect.width as u32, rect.height as u32));
}

/// トーストが出ている間だけカーソルの位置を見る。Tauri には「無視しつつ移動を通す」指定がないので、
/// カードの上に来たときだけ操作を受け取る状態に切り替え、どのカードかを画面へ伝える。
fn start_cursor_watcher(app: &AppHandle) {
    {
        let state = app.state::<WindowState>();
        let mut toast = state.toast.lock().expect("toast");
        if toast.watcher_started {
            return;
        }
        toast.watcher_started = true;
    }
    let app = app.clone();
    std::thread::spawn(move || {
        loop {
            let visible = app
                .state::<WindowState>()
                .toast
                .lock()
                .expect("toast")
                .visible;
            std::thread::sleep(if visible { CURSOR_POLL } else { IDLE_POLL });
            if !visible {
                continue;
            }
            let Some(window) = app.get_webview_window(TOAST) else {
                continue;
            };
            let (Ok(cursor), Ok(origin), Ok(scale)) = (
                window.cursor_position(),
                window.inner_position(),
                window.scale_factor(),
            ) else {
                continue;
            };
            let state = app.state::<WindowState>();
            let mut toast = state.toast.lock().expect("toast");
            let hit = card_at(
                (cursor.x, cursor.y),
                (f64::from(origin.x), f64::from(origin.y)),
                scale,
                &toast.cards,
            );
            if hit == toast.hovered {
                continue;
            }
            toast.hovered = hit;
            drop(toast);
            let _ = window.set_ignore_cursor_events(hit.is_none());
            let _ = app.emit_to(TOAST, "toast-hover", hit);
        }
    });
}
