//! 仮想デスクトップへの追従。表示中のウィンドウを、利用者が今いるデスクトップへ連れてくる。
//! 「全デスクトップに固定」はしない（今いる画面へ引っ張るだけ）。
//! トレイに隠れている窓と最小化中の窓は動かさない。

use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager, WebviewWindow};
use windows::Win32::Foundation::HWND;

use crate::follow::{Backoff, movers};
use crate::winapi::Desktops;

/// 表示に戻ったときに、失敗で伸びた間隔をふだんに戻すための合図。
static WAKE: AtomicBool = AtomicBool::new(false);
const SLICE: Duration = Duration::from_millis(100);

pub fn wake() {
    WAKE.store(true, Ordering::SeqCst);
}

struct Target {
    window: WebviewWindow,
    hwnd: HWND,
}

fn targets(app: &AppHandle) -> Vec<Target> {
    ["main", "mini"]
        .into_iter()
        .filter_map(|label| app.get_webview_window(label))
        .filter(|window| {
            window.is_visible().unwrap_or(false) && !window.is_minimized().unwrap_or(true)
        })
        .filter_map(|window| {
            let hwnd = window.hwnd().ok()?;
            Some(Target { window, hwnd })
        })
        .collect()
}

pub fn start(app: AppHandle) {
    thread::spawn(move || run(&app));
}

fn run(app: &AppHandle) {
    let desktops = match Desktops::new() {
        Ok(desktops) => desktops,
        Err(e) => {
            // 仮想デスクトップに触れないだけ。アプリは普通に動かす。
            eprintln!("仮想デスクトップの追従をやめます: {e}");
            return;
        }
    };
    let mut backoff = Backoff::default();
    let mut last_desktop = None;
    loop {
        // 次の巡回まで待つ。表示に戻ったら、待たずに間隔を戻して巡回する。
        let waited = Instant::now();
        while waited.elapsed() < backoff.interval() {
            if WAKE.swap(false, Ordering::SeqCst) {
                backoff.reset();
                break;
            }
            thread::sleep(SLICE);
        }

        let all = targets(app);
        if all.is_empty() {
            continue;
        }
        let strays: Vec<usize> = (0..all.len())
            .filter(|i| desktops.is_on_current(all[*i].hwnd) == Some(false))
            .collect();

        let current = desktops.current_from_foreground().or_else(|| {
            (!strays.is_empty())
                .then(|| desktops.current_from_probe())
                .flatten()
        });
        let Some(current) = current else {
            // 動かす相手が居るのに今のデスクトップが分からなかった。
            if !strays.is_empty() {
                backoff.slow_down();
            }
            continue;
        };

        let switched = last_desktop.is_some_and(|last| last != current);
        last_desktop = Some(current);
        let indexes: Vec<usize> = (0..all.len()).collect();
        let moving = movers(switched, &indexes, &strays);
        if moving.is_empty() {
            backoff.reset();
            continue;
        }
        let mut failed = false;
        for i in moving {
            let target = &all[i];
            let raise = target.window.is_always_on_top().unwrap_or(false);
            if let Err(e) = desktops.move_to(target.hwnd, &current, raise) {
                eprintln!("仮想デスクトップへの移動に失敗しました: {e}");
                failed = true;
            }
        }
        if failed {
            backoff.slow_down();
        } else {
            backoff.reset();
        }
    }
}
