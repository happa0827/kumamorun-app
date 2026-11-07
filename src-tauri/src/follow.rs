//! 仮想デスクトップへの追従の方針。どのウィンドウを動かすかと、失敗が続くときの間隔。
//! 実際の COM 呼び出しは `winapi`。

use std::time::Duration;

/// ふだんの巡回間隔。
pub const BASE_INTERVAL: Duration = Duration::from_millis(500);
/// 移動に失敗し続けるときの上限。探査用の窓を頻繁に作り直さないための保険。
pub const MAX_INTERVAL: Duration = Duration::from_secs(30);

/// 失敗が続くほど巡回を間引く。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Backoff {
    interval: Duration,
}

impl Default for Backoff {
    fn default() -> Self {
        Self {
            interval: BASE_INTERVAL,
        }
    }
}

impl Backoff {
    pub fn interval(&self) -> Duration {
        self.interval
    }

    /// 失敗した。次の間隔を4倍にする。
    pub fn slow_down(&mut self) {
        self.interval = (self.interval * 4).min(MAX_INTERVAL);
    }

    /// 成功した、または表示に戻った。ふだんの間隔に戻す。
    pub fn reset(&mut self) {
        self.interval = BASE_INTERVAL;
    }
}

/// 今のデスクトップへ動かすウィンドウを選ぶ。
/// デスクトップが切り替わった直後は、タスクバーに出ない窓（ミニ）がどこに居るか分からないので、
/// 対象をすべて連れて行く。それ以外は、別のデスクトップに居ると分かった窓だけ動かす。
pub fn movers<T: Clone>(switched: bool, targets: &[T], strays: &[T]) -> Vec<T> {
    if switched {
        targets.to_vec()
    } else {
        strays.to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn 失敗するたび4倍に間引き_30秒で止まる() {
        let mut backoff = Backoff::default();
        assert_eq!(backoff.interval(), Duration::from_millis(500));
        backoff.slow_down();
        assert_eq!(backoff.interval(), Duration::from_secs(2));
        backoff.slow_down();
        assert_eq!(backoff.interval(), Duration::from_secs(8));
        backoff.slow_down();
        assert_eq!(backoff.interval(), Duration::from_secs(30));
        backoff.slow_down();
        assert_eq!(backoff.interval(), Duration::from_secs(30));
    }

    #[test]
    fn 成功するとふだんの間隔に戻る() {
        let mut backoff = Backoff::default();
        backoff.slow_down();
        backoff.slow_down();
        backoff.reset();
        assert_eq!(backoff.interval(), BASE_INTERVAL);
    }

    #[test]
    fn 切り替えがなければ_別のデスクトップに居る窓だけ動かす() {
        assert_eq!(movers(false, &["main", "mini"], &["mini"]), vec!["mini"]);
        assert!(movers::<&str>(false, &["main"], &[]).is_empty());
    }

    #[test]
    fn 切り替わった直後は_対象をすべて連れて行く() {
        assert_eq!(
            movers(true, &["main", "mini"], &[]),
            vec!["main", "mini"]
        );
    }
}
