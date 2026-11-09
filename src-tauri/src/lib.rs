pub mod app;
pub mod audio_out;
pub mod cloud;
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
        // `kumamorun://auth?code=…` を受ける（サイトの「アプリを開く」）。
        .plugin(tauri_plugin_deep_link::init())
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
            app::export_backup,
            cloud::worker::get_cloud,
            cloud::worker::open_login,
            cloud::worker::open_site,
            cloud::worker::log_out_cloud,
            updater::check_update,
            updater::install_update,
            windows::open_mini,
            windows::close_mini,
            windows::set_focus_mode,
            windows::toast_ready,
            windows::toast_layout,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // 終了するとき、サイトを「停止」にする。強制終了なら、ハートビートが途絶えて停止になる。
            if let tauri::RunEvent::Exit = event {
                cloud::offline_on_exit(app);
            }
        });
}
