//! メインウィンドウを前面に固定する方針。時間切れやアラームのときに、
//! 隠れていても最小化されていても見える状態にし、次の操作まで消させない。
//! ここは「何をするか」を決めるだけで、ウィンドウの実操作は呼び出し側が行う。

use crate::domain::effects::Surface;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PinAction {
    /// ミニウィンドウが開いていれば閉じる。
    CloseMini,
    /// 最小化を戻し、閉じられない最前面にして表示する。
    ShowPinned,
    /// 全画面と最前面を解除し、最小化できる状態に戻す。
    Unpin,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CloseDecision {
    /// 閉じずにトレイへ隠す。
    Hide,
    /// 閉じずに前面を保つ。
    KeepVisible,
    /// アプリの終了なので閉じる。
    Allow,
}

#[derive(Debug, Default)]
pub struct Pin {
    /// 時間切れの固定。アラームの解除や設定の保存では外さない。
    keep: bool,
    pinned: bool,
    quitting: bool,
}

impl Pin {
    pub fn is_pinned(&self) -> bool {
        self.pinned
    }

    pub fn surface(&mut self, surface: Surface) -> Vec<PinAction> {
        if surface == Surface::Keep {
            self.keep = true;
        }
        self.pinned = true;
        vec![PinAction::CloseMini, PinAction::ShowPinned]
    }

    /// `force` でなければ、時間切れの固定は外さない。
    pub fn release(&mut self, force: bool) -> Vec<PinAction> {
        if !force && self.keep {
            return Vec::new();
        }
        self.keep = false;
        self.pinned = false;
        vec![PinAction::Unpin]
    }

    pub fn on_close_requested(&mut self) -> CloseDecision {
        if self.quitting {
            CloseDecision::Allow
        } else if self.pinned {
            CloseDecision::KeepVisible
        } else {
            CloseDecision::Hide
        }
    }

    /// Win+↓ などで最小化できてしまうので、固定中はすぐ戻す。
    pub fn on_minimized(&self) -> Option<PinAction> {
        self.pinned.then_some(PinAction::ShowPinned)
    }

    pub fn mini_allowed(&self) -> bool {
        !self.pinned
    }

    pub fn quitting(&mut self) {
        self.quitting = true;
    }

    pub fn is_quitting(&self) -> bool {
        self.quitting
    }
}

#[cfg(test)]
mod tests;
