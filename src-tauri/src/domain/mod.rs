//! Kumamorun のドメイン。時刻は引数で受け取り、OS・Tauri・Firebase には依存しない。
//! 時刻は端末のローカル時刻（`NaiveDateTime`）で扱う。

pub mod effects;
pub mod engine;
pub mod growth;
pub mod restrictions;
pub mod stop_confirm;
pub mod timer;
