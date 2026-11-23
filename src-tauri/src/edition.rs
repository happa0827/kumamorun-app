//! アプリの版。サイトで承認されたアカウントだけが完全版になる。
//! 判断の理由は `docs/adr/0003-demo-edition.md`、サイトとの約束は `docs/plan/demo-edition.md`。
//!
//! - デモ版: キャラクターはシルエット。進化と開花は反映しない。スタート制限は効かず、変えられない。
//! - 完全版: キャラクターの画像をサーバーから受け取って見せる。すべての機能を使える。

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Edition {
    /// ログインしていない、または承認されていないアカウント。
    #[default]
    Demo,
    Full,
}

impl Edition {
    /// サーバーの値を読む。`"full"` のときだけ完全版で、それ以外（欠けている、知らない値）はデモ版。
    pub fn from_wire(value: Option<&str>) -> Self {
        match value {
            Some("full") => Edition::Full,
            _ => Edition::Demo,
        }
    }

    pub fn is_full(self) -> bool {
        self == Edition::Full
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn サーバーの値はfullのときだけ完全版() {
        assert_eq!(Edition::from_wire(Some("full")), Edition::Full);
        for other in [None, Some("demo"), Some("FULL"), Some("")] {
            assert_eq!(Edition::from_wire(other), Edition::Demo, "{other:?}");
        }
    }

    #[test]
    fn 保存の形() {
        assert_eq!(serde_json::to_value(Edition::Full).unwrap(), "full");
        assert_eq!(serde_json::to_value(Edition::Demo).unwrap(), "demo");
    }
}
