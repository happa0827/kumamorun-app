//! 端末のトークンの保管。OS の資格情報ストア（Windows の資格情報マネージャー）に置き、
//! WebView には渡さない。サーバーごとに別の項目にして、開発用のサーバーのトークンが
//! 本番に使われないようにする。

use keyring::Entry;

const SERVICE: &str = "com.kumamorun.app";

pub trait TokenStore: Send + Sync {
    fn load(&self) -> Option<String>;
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
    fn load(&self) -> Option<String> {
        match self.entry().and_then(|entry| entry.get_password()) {
            Ok(token) => Some(token),
            Err(keyring::Error::NoEntry) => None,
            Err(e) => {
                eprintln!("トークンを読めません: {e}");
                None
            }
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
