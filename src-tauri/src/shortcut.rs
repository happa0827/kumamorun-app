//! 残り時間を読み上げるグローバルショートカット。他のアプリで作業中でも、
//! ウィンドウが隠れていても、ミニ表示中でも押せる。

use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::player;

/// ショートカットを付け替える。空文字なら無効にするだけ。
/// 失敗するのは、他のアプリがそのキーを押さえているか、書式が不正なとき。
pub fn apply(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    let shortcuts = app.global_shortcut();
    shortcuts.unregister_all().map_err(|e| e.to_string())?;
    if accelerator.is_empty() {
        return Ok(());
    }
    shortcuts
        .on_shortcut(accelerator, |app, _, event| {
            if event.state() == ShortcutState::Pressed {
                player::speak_remaining(app, None);
            }
        })
        .map_err(|_| "そのキーは使えません（他のアプリが使っているか、書式が不正です）".to_string())
}
