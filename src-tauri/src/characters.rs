//! 完全版のキャラクター画像。アプリにもリポジトリにも入れず、承認されたアカウントの端末だけが
//! サーバー（`GET /characters/{key}`）から受け取り、アプリのデータフォルダーに置く。
//! WebView へは `character://` のプロトコルで渡す（完全版の間だけ）。
//! デモ版になったら（ログアウト、承認の取り消し）、置いた画像は消す。

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// 画像の名前。成長段階 0〜5 と、開花した日の花。花の名前は `View::bloom` と同じ。
pub const KEYS: [&str; 10] = [
    "stage0",
    "stage1",
    "stage2",
    "stage3",
    "stage4",
    "stage5",
    "dandelion",
    "peony",
    "blueSpiderLily",
    "nightCherry",
];

/// 1枚の上限。想定より大きい応答は受け取らない。
pub const MAX_BYTES: usize = 2 * 1024 * 1024;

const VERSION_FILE: &str = "version";

pub fn is_png(bytes: &[u8]) -> bool {
    bytes.starts_with(b"\x89PNG\r\n\x1a\n")
}

/// 画像の版の名前として使ってよいか。ファイルに書き、WebView の URL にも載せるので、文字を絞る。
pub fn is_valid_version(version: &str) -> bool {
    (1..=64).contains(&version.len())
        && version
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
}

pub struct CharacterCache {
    dir: PathBuf,
}

impl CharacterCache {
    pub fn new(dir: PathBuf) -> Self {
        Self { dir }
    }

    fn image_path(&self, key: &str) -> PathBuf {
        self.dir.join(format!("{key}.png"))
    }

    /// そろっている画像の版。1枚でも欠けていれば `None`。
    pub fn version(&self) -> Option<String> {
        let version = fs::read_to_string(self.dir.join(VERSION_FILE)).ok()?;
        let version = version.trim();
        let complete = KEYS.iter().all(|key| self.image_path(key).is_file());
        (complete && is_valid_version(version)).then(|| version.to_string())
    }

    /// 隣のフォルダー（`characters.tmp` など）。
    fn sibling_dir(&self, suffix: &str) -> PathBuf {
        let mut name = self.dir.file_name().unwrap_or_default().to_os_string();
        name.push(suffix);
        self.dir.with_file_name(name)
    }

    /// 新しい版をそろえる作業用のフォルダー。
    fn staging_dir(&self) -> PathBuf {
        self.sibling_dir(".tmp")
    }

    /// 入れ替えの間だけ、前の版を退避しておくフォルダー。
    fn backup_dir(&self) -> PathBuf {
        self.sibling_dir(".old")
    }

    /// 1組の画像を置き換える。作業用のフォルダーにそろえてから入れ替えるので、
    /// 書いている間も前の版が見え、途中で失敗しても前の版が残る。
    pub fn store(&self, version: &str, images: &[(&str, Vec<u8>)]) -> io::Result<()> {
        if !is_valid_version(version) {
            return Err(io::Error::other("画像の版の名前が不正です"));
        }
        for (key, bytes) in images {
            if !KEYS.contains(key) || !is_png(bytes) {
                return Err(io::Error::other(format!("{key} は受け取れない画像です")));
            }
        }
        let staging = self.staging_dir();
        remove_dir(&staging)?;
        fs::create_dir_all(&staging)?;
        let written = (|| {
            for (key, bytes) in images {
                fs::write(staging.join(format!("{key}.png")), bytes)?;
            }
            fs::write(staging.join(VERSION_FILE), version)
        })();
        if let Err(e) = written {
            let _ = remove_dir(&staging);
            return Err(e);
        }
        self.promote(&staging)
    }

    /// そろえたフォルダーを本番にする。Windows では置き換え先があると rename できないので、
    /// 前の版をいったん退避し、入れ替えに失敗したら戻す。退避は、入れ替えに成功してから消す。
    fn promote(&self, staging: &Path) -> io::Result<()> {
        let backup = self.backup_dir();
        remove_dir(&backup)?;
        let had_previous = self.dir.exists();
        if had_previous && let Err(e) = fs::rename(&self.dir, &backup) {
            let _ = remove_dir(staging);
            return Err(e);
        }
        if let Err(e) = fs::rename(staging, &self.dir) {
            if had_previous {
                let _ = fs::rename(&backup, &self.dir);
            }
            let _ = remove_dir(staging);
            return Err(e);
        }
        // 前の版は、もう要らない。消せなくても次の入れ替えか `clear` で消える。
        let _ = remove_dir(&backup);
        Ok(())
    }

    /// 置いた画像をすべて消す（作業用と退避のフォルダーも）。
    pub fn clear(&self) -> io::Result<()> {
        remove_dir(&self.staging_dir())?;
        remove_dir(&self.backup_dir())?;
        remove_dir(&self.dir)
    }

    /// 1枚読む。知らない名前と、そろっていないときは `None`。
    pub fn read(&self, key: &str) -> Option<Vec<u8>> {
        self.version()?;
        self.read_image(key)
    }

    /// 1枚読む。そろっているかは確かめない（呼ぶ側が、そろった版をメモリに持っているとき用）。
    /// 知らない名前と、ファイルが無いときは `None`。
    pub fn read_image(&self, key: &str) -> Option<Vec<u8>> {
        if !KEYS.contains(&key) {
            return None;
        }
        fs::read(self.image_path(key)).ok()
    }

    pub fn dir(&self) -> &Path {
        &self.dir
    }
}

/// フォルダーを中身ごと消す。無ければ何もしない。
fn remove_dir(dir: &Path) -> io::Result<()> {
    match fs::remove_dir_all(dir) {
        Err(e) if e.kind() != io::ErrorKind::NotFound => Err(e),
        _ => Ok(()),
    }
}

/// `character://localhost/stage0` などの経路から、画像の名前を取り出す。
pub fn key_from_path(path: &str) -> &str {
    let key = path.trim_start_matches('/');
    key.strip_suffix(".png").unwrap_or(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    const PNG: &[u8] = b"\x89PNG\r\n\x1a\nrest";

    fn all(bytes: &[u8]) -> Vec<(&'static str, Vec<u8>)> {
        KEYS.iter().map(|key| (*key, bytes.to_vec())).collect()
    }

    fn cache(dir: &tempfile::TempDir) -> CharacterCache {
        CharacterCache::new(dir.path().join("characters"))
    }

    #[test]
    fn 置いた画像を版つきで読める() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        assert_eq!(cache.version(), None);
        cache.store("2026-11-23", &all(PNG)).unwrap();
        assert_eq!(cache.version().as_deref(), Some("2026-11-23"));
        assert_eq!(cache.read("stage3").as_deref(), Some(PNG));
        assert_eq!(cache.read("nightCherry").as_deref(), Some(PNG));
    }

    #[test]
    fn 知らない名前や_外を指す名前は読まない() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        cache.store("v1", &all(PNG)).unwrap();
        for key in ["stage6", "../state", "version", ""] {
            assert_eq!(cache.read(key), None, "{key}");
            assert_eq!(cache.read_image(key), None, "{key}");
        }
    }

    #[test]
    fn 一枚でも欠けていれば_そろっていない() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        cache.store("v1", &all(PNG)).unwrap();
        fs::remove_file(cache.dir().join("peony.png")).unwrap();
        assert_eq!(cache.version(), None);
        assert_eq!(cache.read("stage0"), None);
    }

    #[test]
    fn pngでないものは置かない() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        assert!(cache.store("v1", &all(b"<html>")).is_err());
        assert_eq!(cache.version(), None);
    }

    #[test]
    fn 置き換えに失敗しても_前の版が残り_作業用のフォルダーも残らない() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        cache.store("v1", &all(PNG)).unwrap();
        let mut bad = all(PNG);
        bad[3].1 = b"<html>".to_vec();
        assert!(cache.store("v2", &bad).is_err());
        assert_eq!(cache.version().as_deref(), Some("v1"));
        assert_eq!(cache.read("stage0").as_deref(), Some(PNG));
        assert!(!dir.path().join("characters.tmp").exists());
    }

    #[test]
    fn 入れ替えに失敗したら_前の版を戻す() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        cache.store("v1", &all(PNG)).unwrap();
        // 存在しない作業用のフォルダーは rename できないので、入れ替えが失敗する。
        let missing = dir.path().join("missing");
        assert!(cache.promote(&missing).is_err());
        assert_eq!(cache.version().as_deref(), Some("v1"));
        assert!(!dir.path().join("characters.old").exists());
    }

    #[test]
    fn 消すと_作業用と退避のフォルダーも残らない() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        cache.store("v1", &all(PNG)).unwrap();
        for name in ["characters.tmp", "characters.old"] {
            fs::create_dir_all(dir.path().join(name)).unwrap();
        }
        cache.clear().unwrap();
        for name in ["characters", "characters.tmp", "characters.old"] {
            assert!(!dir.path().join(name).exists(), "{name}");
        }
    }

    #[test]
    fn 前回の作業用のフォルダーが残っていても置き換えられる() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        fs::create_dir_all(dir.path().join("characters.tmp")).unwrap();
        fs::write(dir.path().join("characters.tmp").join("junk.png"), PNG).unwrap();
        cache.store("v1", &all(PNG)).unwrap();
        assert_eq!(cache.version().as_deref(), Some("v1"));
        assert!(!cache.dir().join("junk.png").exists());
        assert!(!dir.path().join("characters.tmp").exists());
    }

    #[test]
    fn 消すと何も残らない() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        cache.clear().unwrap();
        cache.store("v1", &all(PNG)).unwrap();
        cache.clear().unwrap();
        assert!(!cache.dir().exists());
        assert_eq!(cache.read("stage0"), None);
    }

    #[test]
    fn 置き換えると前の版の画像は残らない() {
        let dir = tempfile::tempdir().unwrap();
        let cache = cache(&dir);
        cache.store("v1", &all(PNG)).unwrap();
        fs::write(cache.dir().join("old.png"), PNG).unwrap();
        cache.store("v2", &all(PNG)).unwrap();
        assert_eq!(cache.version().as_deref(), Some("v2"));
        assert!(!cache.dir().join("old.png").exists());
    }

    #[test]
    fn 版の名前は安全な文字だけ() {
        for ok in ["v1", "2026-11-23", "a.b_c"] {
            assert!(is_valid_version(ok), "{ok}");
        }
        for bad in ["", "../x", "a/b", "a b", "ばん", &"x".repeat(65)] {
            assert!(!is_valid_version(bad), "{bad}");
        }
    }

    #[test]
    fn 経路から画像の名前を取り出す() {
        assert_eq!(key_from_path("/stage0"), "stage0");
        assert_eq!(key_from_path("/peony.png"), "peony");
        assert_eq!(key_from_path("stage5"), "stage5");
    }
}
