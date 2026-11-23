//! 端末のトークンの保管。OS の資格情報ストア（Windows の資格情報マネージャー）に置き、
//! WebView には渡さない。サーバーごとに別の項目にして、開発用のサーバーのトークンが
//! 本番に使われないようにする。

use keyring::Entry;

const SERVICE: &str = "com.kumamorun.app";

pub trait TokenStore: Send + Sync {
    /// 保管したトークン。`Ok(None)` は保管していない（ログインしていない）。
    /// `Err` は読めなかった（資格情報ストアの一時的なエラーなど）で、ログインしていないとは限らない。
    fn load(&self) -> Result<Option<String>, String>;
    fn save(&self, token: &str) -> Result<(), String>;
    fn clear(&self);
}

pub struct KeyringStore {
    user: String,
}

impl KeyringStore {
    pub fn new(base_url: &str) -> Self {
        Self {
            user: format!("device-token {base_url}"),
        }
    }

    fn entry(&self) -> Result<Entry, keyring::Error> {
        Entry::new(SERVICE, &self.user)
    }
}

impl TokenStore for KeyringStore {
    fn load(&self) -> Result<Option<String>, String> {
        match self.entry().and_then(|entry| entry.get_password()) {
            Ok(token) => Ok(Some(token)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("トークンを読めません: {e}")),
        }
    }

    fn save(&self, token: &str) -> Result<(), String> {
        self.entry()
            .and_then(|entry| entry.set_password(token))
            .map_err(|e| format!("トークンを保管できません: {e}"))
    }

    fn clear(&self) {
        if let Err(e) = self.entry().and_then(|entry| entry.delete_credential())
            && !matches!(e, keyring::Error::NoEntry)
        {
            eprintln!("トークンを消せません: {e}");
        }
    }
}
