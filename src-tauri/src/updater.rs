//! アプリ内の更新。確認は起動時に画面が行い、入れるのは利用者が押したときだけ。
//! タイマーの最中に、勝手に再起動しないため。

use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

#[derive(Serialize)]
pub struct UpdateInfo {
    pub version: String,
    pub notes: Option<String>,
}

/// 新しい版があれば知らせる。開発ビルドは確認しない（開発中の版は配布物と別物）。
#[tauri::command]
pub async fn check_update(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    if cfg!(debug_assertions) {
        return Ok(None);
    }
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;
    Ok(update.map(|update| UpdateInfo {
        version: update.version.clone(),
        notes: update.body.clone(),
    }))
}

/// 新しい版をダウンロードして入れ、再起動する。
#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    if cfg!(debug_assertions) {
        return Err("開発ビルドでは更新できません".into());
    }
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?
        .ok_or("新しい版はありません")?;
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| e.to_string())?;
    // 入れ終わったら、閉じる操作を止める仕組みを外して再起動する。
    crate::windows::quit_for_restart(&app);
    Ok(())
}
