//! ディープリンク `kumamorun://auth?code=…` の解釈。サイトが渡すのは使い捨てコードだけで、
//! トークンは URL に載せない。

use url::Url;

/// コードの長さの上限。サーバーも 200 文字までしか受けない。
const MAX_CODE_LEN: usize = 200;

/// ログイン用のリンクから、使い捨てコードを取り出す。別のリンクや、コードの無いリンクは `None`。
pub fn code_from_link(link: &str) -> Option<String> {
    let url = Url::parse(link).ok()?;
    if url.scheme() != "kumamorun" || url.host_str() != Some("auth") {
        return None;
    }
    url.query_pairs()
        .find(|(key, _)| key == "code")
        .map(|(_, value)| value.into_owned())
        .filter(|code| !code.is_empty() && code.len() <= MAX_CODE_LEN)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn コードを取り出す() {
        assert_eq!(
            code_from_link("kumamorun://auth?code=abc123"),
            Some("abc123".into())
        );
    }

    #[test]
    fn パーセントエンコードされたコードも読む() {
        assert_eq!(
            code_from_link("kumamorun://auth?code=a%2Bb%3D"),
            Some("a+b=".into())
        );
    }

    #[test]
    fn 末尾のスラッシュや他のパラメーターがあっても読める() {
        assert_eq!(
            code_from_link("kumamorun://auth/?x=1&code=zzz"),
            Some("zzz".into())
        );
    }

    #[test]
    fn 別のリンクは無視する() {
        assert_eq!(code_from_link("https://example.com/?code=abc"), None);
        assert_eq!(code_from_link("kumamorun://other?code=abc"), None);
        assert_eq!(code_from_link("otherapp://auth?code=abc"), None);
    }

    #[test]
    fn コードが無い_空_長すぎる_壊れたリンクは捨てる() {
        assert_eq!(code_from_link("kumamorun://auth"), None);
        assert_eq!(code_from_link("kumamorun://auth?code="), None);
        let long = format!("kumamorun://auth?code={}", "a".repeat(201));
        assert_eq!(code_from_link(&long), None);
        assert_eq!(code_from_link("これはリンクではない"), None);
    }
}
