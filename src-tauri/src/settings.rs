//! 端末の設定。ドメインの規則ではなく、操作の既定値など利用者の好み。

use serde::{Deserialize, Serialize};

use crate::domain::timer::TimerKind;

/// 音の用途。出力先の設定が用途ごとにある。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Use {
    /// 遊びの完走。
    Play,
    /// 休憩の完走。
    Break,
    /// お知らせ（残り5分・20-20-20ルール）。
    Notify,
    /// その他（進化・開花・スタート制限・読み上げ）。ほかの用途の既定でもある。
    Shared,
}

/// 音の出力先。空文字は OS の既定のスピーカー。
/// 用途ごとの設定が無い（`None`）ときは、共通の設定にならう。
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Speakers {
    pub play: Option<String>,
    pub rest: Option<String>,
    pub notify: Option<String>,
    pub shared: String,
}

impl Speakers {
    pub fn device(&self, use_: Use) -> &str {
        let chosen = match use_ {
            Use::Play => &self.play,
            Use::Break => &self.rest,
            Use::Notify => &self.notify,
            Use::Shared => &None,
        };
        chosen.as_deref().unwrap_or(&self.shared)
    }
}

/// 残り時間を読み上げるグローバルショートカットの既定。
pub const DEFAULT_SPEAK_SHORTCUT: &str = "CommandOrControl+Alt+T";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    /// 遊びの既定時間（秒）。
    pub play_secs: Option<i64>,
    /// 休憩の既定時間（秒）。
    pub break_secs: Option<i64>,
    pub speakers: Speakers,
    /// 読み上げのショートカット。空文字なら無効。
    pub speak_shortcut: String,
    /// 読み上げの音量（0〜100%）。0 なら読み上げない。
    pub speak_volume: u8,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            play_secs: None,
            break_secs: None,
            speakers: Speakers::default(),
            speak_shortcut: DEFAULT_SPEAK_SHORTCUT.into(),
            speak_volume: 100,
        }
    }
}

fn positive(secs: Option<i64>) -> Option<i64> {
    secs.filter(|secs| *secs > 0)
}

impl Settings {
    /// 0以下の値は「設定なし」として保存する。
    pub fn new(play_secs: Option<i64>, break_secs: Option<i64>) -> Self {
        Self {
            play_secs: positive(play_secs),
            break_secs: positive(break_secs),
            ..Self::default()
        }
    }

    /// スタートする長さ（秒）を決める。入力が空か不正なら既定時間を使う。
    /// どちらもなければ `None`。
    pub fn resolve(&self, kind: TimerKind, input: Option<i64>) -> Option<i64> {
        let default = match kind {
            TimerKind::Play => self.play_secs,
            TimerKind::Break => self.break_secs,
        };
        positive(input).or(positive(default))
    }
}

#[cfg(test)]
mod tests;
