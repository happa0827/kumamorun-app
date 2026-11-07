//! Windows の API を直接呼ぶ層。OS に依存する処理のうち、ウィンドウ操作で済まないものはここに置く。
//! 何をするかの方針は `follow` と、ドメインの `Effect` が決める。

use windows::Win32::Foundation::HWND;
use windows::Win32::System::Com::{
    CLSCTX_ALL, COINIT_APARTMENTTHREADED, CoCreateInstance, CoInitializeEx,
};
use windows::Win32::System::Power::SetSuspendState;
use windows::Win32::UI::Shell::{IVirtualDesktopManager, VirtualDesktopManager};
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExW, DestroyWindow, DispatchMessageW, GetForegroundWindow, HWND_TOP, PM_REMOVE,
    PeekMessageW, SW_SHOWNOACTIVATE, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SetWindowPos,
    ShowWindow, TranslateMessage, WINDOW_EX_STYLE, WS_POPUP,
};
use windows::core::{GUID, w};

use std::time::{Duration, Instant};

/// OS をスリープ（休止ではない）させる。戻るのは、復帰したあと。
pub fn sleep_now() -> Result<(), String> {
    // SAFETY: 引数は値だけで、ポインターを渡さない。
    let ok = unsafe { SetSuspendState(false, true, false) };
    if ok {
        Ok(())
    } else {
        Err("スリープできませんでした".into())
    }
}

/// 仮想デスクトップを扱う窓口。作ったスレッドでだけ使う（COM の単一スレッド）。
pub struct Desktops {
    manager: IVirtualDesktopManager,
}

impl Desktops {
    pub fn new() -> Result<Self, String> {
        // SAFETY: このスレッドの COM を初期化する。他のスレッドの COM には触れない。
        // S_FALSE（初期化済み）や別モードで初期化済みの場合も、使える状態なので結果は見ない。
        unsafe {
            let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            let manager = CoCreateInstance(&VirtualDesktopManager, None, CLSCTX_ALL)
                .map_err(|e| format!("IVirtualDesktopManager を作れません: {e}"))?;
            Ok(Self { manager })
        }
    }

    /// 今のデスクトップに居るか。分からないときは `None`（何もしない）。
    pub fn is_on_current(&self, window: HWND) -> Option<bool> {
        // SAFETY: HWND は値渡しで、無効でも COM がエラーを返すだけ。
        unsafe { self.manager.IsWindowOnCurrentVirtualDesktop(window) }
            .ok()
            .map(|on| on.as_bool())
    }

    /// 窓が居るデスクトップの ID。タスクバーに出ない窓などは空（GUID_NULL）なので `None`。
    fn id_of(&self, window: HWND) -> Option<GUID> {
        // SAFETY: 同上。
        let id = unsafe { self.manager.GetWindowDesktopId(window) }.ok()?;
        (id != GUID::zeroed()).then_some(id)
    }

    /// 今のデスクトップの ID。前景のウィンドウから借りる。
    /// 切り替えの途中は前の画面の窓が前景のことがあるので、今のデスクトップに居ると確かめてから使う。
    pub fn current_from_foreground(&self) -> Option<GUID> {
        // SAFETY: 引数なしで、前景ウィンドウのハンドルを返すだけ。
        let foreground = unsafe { GetForegroundWindow() };
        if foreground.is_invalid() || self.is_on_current(foreground) != Some(true) {
            return None;
        }
        self.id_of(foreground)
    }

    /// 前景から借りられないときの逃げ道。新しい窓は必ず今のデスクトップに生まれるので、
    /// 1x1 の窓を出して ID を借り、すぐ捨てる。
    /// 表示した直後はまだ ID が付かないので、メッセージを一巡させる間待つ。
    pub fn current_from_probe(&self) -> Option<GUID> {
        // SAFETY: 自分で作った窓だけを操作し、最後に必ず破棄する。
        unsafe {
            // 既定の "STATIC" クラスを使う（クラスの登録が要らない）。
            // 非表示・NOACTIVATE・タスクバー非表示の窓は ID が付かないので、そのどれにもしない。
            let probe = CreateWindowExW(
                WINDOW_EX_STYLE(0),
                w!("STATIC"),
                w!(""),
                WS_POPUP,
                -4000,
                -4000,
                1,
                1,
                None,
                None,
                None,
                None,
            )
            .ok()?;
            let _ = ShowWindow(probe, SW_SHOWNOACTIVATE);
            let started = Instant::now();
            while started.elapsed() < Duration::from_millis(80) {
                let mut message = std::mem::zeroed();
                while PeekMessageW(&mut message, None, 0, 0, PM_REMOVE).as_bool() {
                    let _ = TranslateMessage(&message);
                    DispatchMessageW(&message);
                }
                std::thread::sleep(Duration::from_millis(10));
            }
            let id = self.id_of(probe);
            let _ = DestroyWindow(probe);
            id
        }
    }

    /// 窓を、そのデスクトップへ動かす。常時最前面の窓は、移った先で埋もれることがあるので前へ出す。
    /// フォーカスは奪わない（作業中のアプリから入力を奪ってしまうため）。
    pub fn move_to(&self, window: HWND, desktop: &GUID, raise: bool) -> Result<(), String> {
        // SAFETY: 同上。
        unsafe {
            self.manager
                .MoveWindowToDesktop(window, desktop)
                .map_err(|e| format!("MoveWindowToDesktop: {e}"))?;
            if raise {
                let _ = SetWindowPos(
                    window,
                    Some(HWND_TOP),
                    0,
                    0,
                    0,
                    0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
                );
            }
        }
        Ok(())
    }
}
