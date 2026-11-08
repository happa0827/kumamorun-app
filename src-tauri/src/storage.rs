//! 端末ローカルの保存。ドメインの状態を1つの JSON ファイルに書く。
//! 書き込みは一時ファイルを経由して置き換えるので、途中で落ちても前の内容が残る。

use std::fmt;
use std::fs;
use std::io;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::domain::engine::Engine;
use crate::settings::Settings;

/// ファイルの形式の版。互換のない変更をしたら上げる。
const VERSION: u32 = 1;

/// 保存する内容。ドメインの状態と、端末の設定。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Saved {
    pub engine: Engine,
    #[serde(default)]
    pub settings: Settings,
}

#[derive(Debug)]
pub enum StoreError {
    Io(io::Error),
    /// 読めない、または形が合わない。元のファイルは `.corrupt` へ退避した。
    Corrupt {
        reason: String,
    },
    /// このアプリより新しい版で書かれている。ファイルには触れていない。
    UnsupportedVersion {
        found: u32,
    },
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StoreError::Io(e) => write!(f, "保存ファイルを読み書きできません: {e}"),
            StoreError::Corrupt { reason } => write!(f, "保存ファイルが壊れています: {reason}"),
            StoreError::UnsupportedVersion { found } => {
                write!(f, "保存ファイルがこのアプリより新しい版です（版 {found}）")
            }
        }
    }
}

impl std::error::Error for StoreError {}

impl From<io::Error> for StoreError {
    fn from(e: io::Error) -> Self {
        StoreError::Io(e)
    }
}

#[derive(Serialize)]
struct FileOut<'a> {
    version: u32,
    #[serde(flatten)]
    saved: &'a Saved,
}

#[derive(Deserialize)]
struct FileHeader {
    version: u32,
}

#[derive(Deserialize)]
struct FileIn {
    #[serde(flatten)]
    saved: Saved,
}

pub struct Store {
    path: PathBuf,
}

impl Store {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    fn sibling(&self, suffix: &str) -> PathBuf {
        let mut name = self.path.file_name().unwrap_or_default().to_os_string();
        name.push(suffix);
        self.path.with_file_name(name)
    }

    /// 保存済みの状態を読む。ファイルがなければ `None`。
    pub fn load(&self) -> Result<Option<Saved>, StoreError> {
        let text = match fs::read_to_string(&self.path) {
            Ok(text) => text,
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(e.into()),
        };
        match serde_json::from_str::<FileHeader>(&text) {
            Ok(header) if header.version > VERSION => {
                return Err(StoreError::UnsupportedVersion {
                    found: header.version,
                });
            }
            Ok(_) => {}
            Err(e) => return self.quarantine(e.to_string()),
        }
        match serde_json::from_str::<FileIn>(&text) {
            Ok(file) => Ok(Some(file.saved)),
            Err(e) => self.quarantine(e.to_string()),
        }
    }

    /// 壊れたファイルを脇へ移す。次の保存で証拠を上書きしないため。
    fn quarantine(&self, reason: String) -> Result<Option<Saved>, StoreError> {
        fs::rename(&self.path, self.sibling(".corrupt"))?;
        Err(StoreError::Corrupt { reason })
    }

    /// 一時ファイルに書いてから置き換える。
    pub fn save(&self, saved: &Saved) -> Result<(), StoreError> {
        if let Some(dir) = self.path.parent() {
            fs::create_dir_all(dir)?;
        }
        let json = serde_json::to_string_pretty(&FileOut {
            version: VERSION,
            saved,
        })
        .map_err(|e| StoreError::Io(io::Error::other(e)))?;
        let tmp = self.sibling(".tmp");
        fs::write(&tmp, json)?;
        fs::rename(&tmp, &self.path)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests;
