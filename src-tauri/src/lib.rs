pub mod app;
pub mod audio_out;
pub mod cloud_input;
pub mod desktop;
pub mod domain;
pub mod follow;
pub mod notices;
pub mod pin;
pub mod player;
pub mod settings;
pub mod shortcut;
pub mod sound;
pub mod speech;
pub mod storage;
pub mod toast;
pub mod tts;
pub mod updater;
pub mod winapi;
pub mod windows;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 2つ目を起動したら、動いている方を前に出す。
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            windows::show_main(app);
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        // GitHub のページを、既定のブラウザで開く。
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // ログイン時は隠れた状態で起動する（トレイのメニューから切り替える）。
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .setup(app::setup)
        .on_window_event(windows::on_window_event)
        .invoke_handler(tauri::generate_handler![
            app::get_view,
            app::start_timer,
            app::pause_timer,
            app::resume_timer,
            app::press_stopped,
            app::get_settings,
            app::save_settings,
            app::list_outputs,
            app::test_sound,
            app::speak_now,
            app::get_restrictions,
            app::save_restrictions,
            app::apply_cloud_restrictions,
            app::take_evolution,
            app::restore_evolution,
            app::plan_evolution,
            app::commit_evolution,
            app::import_cloud,
            updater::check_update,
            updater::install_update,
            windows::open_mini,
            windows::close_mini,
            windows::set_focus_mode,
            windows::toast_ready,
            windows::toast_layout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
