//! クラウド（Void + Cloudflare + D1）との同期。状態の持ち主は端末（Rust）で、
//! サーバーは写しを預かる。判断は `docs/adr/0002-void-d1-replaces-firebase.md`、
//! 形は `docs/plan/void-migration.md`。

pub mod evolution;
pub mod http;
pub mod link;
pub mod live;
pub mod token;
pub mod wire;
// Tauri のコマンドは、定義したモジュールのパスで登録する（再公開では使えない）。
pub mod worker;

pub use worker::{Cloud, CloudView, base_url, handle_link, offline_on_exit, setup};
