use chrono::{Duration, NaiveDate};

use crate::domain::engine::Engine;
use crate::domain::timer::TimerKind;
use crate::settings::Settings;

use super::*;

fn now() -> chrono::NaiveDateTime {
    NaiveDate::from_ymd_opt(2026, 11, 9)
        .unwrap()
        .and_hms_opt(10, 0, 0)
        .unwrap()
}

fn sample() -> Saved {
    let mut engine = Engine::new(now());
    engine
        .start_timer(TimerKind::Play, Duration::minutes(30), now())
        .unwrap();
    Saved {
        engine,
        settings: Settings::new(Some(1200), Some(300)),
    }
}

fn store_in(dir: &tempfile::TempDir) -> Store {
    Store::new(dir.path().join("state.json"))
}

#[test]
fn ファイルがなければ何も読み込まない() {
    let dir = tempfile::tempdir().unwrap();
    assert!(store_in(&dir).load().unwrap().is_none());
}

#[test]
fn 保存して読み込むと同じ状態() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    let saved = sample();
    store.save(&saved).unwrap();
    assert_eq!(store.load().unwrap(), Some(saved));
}

#[test]
fn 設定も一緒に保存される() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    store.save(&sample()).unwrap();
    let loaded = store.load().unwrap().unwrap();
    assert_eq!(loaded.settings.play_secs, Some(1200));
    assert_eq!(loaded.settings.break_secs, Some(300));
}

#[test]
fn 設定のない古いファイルは初期設定で読める() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    store.save(&sample()).unwrap();
    // 設定のキーを取り除いて、設定を導入する前のファイルを再現する。
    let path = dir.path().join("state.json");
    let mut value: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
    value.as_object_mut().unwrap().remove("settings");
    std::fs::write(&path, value.to_string()).unwrap();

    let loaded = store.load().unwrap().unwrap();
    assert_eq!(loaded.settings, Settings::default());
    assert_eq!(loaded.engine, sample().engine);
}

#[test]
fn 上書きして保存できる() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    store
        .save(&Saved {
            engine: Engine::new(now()),
            settings: Settings::default(),
        })
        .unwrap();
    let saved = sample();
    store.save(&saved).unwrap();
    assert_eq!(store.load().unwrap(), Some(saved));
}

#[test]
fn 保存の後に一時ファイルが残らない() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    store.save(&sample()).unwrap();
    let names: Vec<_> = std::fs::read_dir(dir.path())
        .unwrap()
        .map(|entry| entry.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    assert_eq!(names, vec!["state.json".to_string()]);
}

#[test]
fn 保存先のフォルダーがなければ作る() {
    let dir = tempfile::tempdir().unwrap();
    let store = Store::new(dir.path().join("nested").join("state.json"));
    store.save(&sample()).unwrap();
    assert!(store.load().unwrap().is_some());
}

#[test]
fn 壊れたファイルは退避してエラーを返す() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    std::fs::write(dir.path().join("state.json"), "{ これはJSONではない").unwrap();

    let err = store.load().unwrap_err();
    assert!(matches!(err, StoreError::Corrupt { .. }));
    // 次の保存で証拠を上書きしないよう、元のファイルは脇へ移す。
    assert!(!dir.path().join("state.json").exists());
    assert!(dir.path().join("state.json.corrupt").exists());
    // 退避後は、何もない状態から始められる。
    assert!(store.load().unwrap().is_none());
}

#[test]
fn 形が合わないファイルも壊れたものとして扱う() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    std::fs::write(
        dir.path().join("state.json"),
        r#"{"version":1,"engine":{"today":"2026-11-09"}}"#,
    )
    .unwrap();
    assert!(matches!(
        store.load().unwrap_err(),
        StoreError::Corrupt { .. }
    ));
}

#[test]
fn 新しい版のファイルは触らずにエラーを返す() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    let path = dir.path().join("state.json");
    std::fs::write(&path, r#"{"version":999,"engine":{}}"#).unwrap();

    let err = store.load().unwrap_err();
    assert!(matches!(err, StoreError::UnsupportedVersion { found: 999 }));
    assert!(path.exists());
    assert!(!dir.path().join("state.json.corrupt").exists());
}

#[test]
fn 書き込むのは版つきの一つのjson() {
    let dir = tempfile::tempdir().unwrap();
    let store = store_in(&dir);
    store.save(&sample()).unwrap();
    let text = std::fs::read_to_string(dir.path().join("state.json")).unwrap();
    let value: serde_json::Value = serde_json::from_str(&text).unwrap();
    assert_eq!(value["version"], 1);
    assert!(value["engine"].is_object());
    assert!(value["settings"].is_object());
}
