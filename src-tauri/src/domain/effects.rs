//! ドメインが「何をすべきか」を外側の層へ伝えるための型。
//! 実行（通知の表示、音の再生、ウィンドウの操作）はドメインの外が行う。

use serde::{Deserialize, Serialize};

use crate::domain::growth::Flower;
use crate::domain::timer::TimerKind;

/// 制限時刻の境界。昼休憩の開始、昼休憩の終了、終了時刻。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum Boundary {
    LunchStart,
    LunchEnd,
    EndTime,
}

/// 利用者へ知らせる内容。文言は表示する層が決める。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum Notice {
    /// 遊びまたは休憩が時間切れになった。
    TimerFinished(TimerKind),
    /// まもなく終了。
    TimerWarning { kind: TimerKind, minutes: u32 },
    /// 20-20-20ルール。
    EyeBreak,
    /// 制限時刻に達した。`stopped_play` は、動いていた遊びを打ち切ったか。
    Boundary {
        boundary: Boundary,
        stopped_play: bool,
    },
    /// キャラが進化した。
    Evolved,
    /// 開花した。
    Bloomed { flower: Flower },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum Sound {
    /// 時間切れ。長く続く不規則ビープ。出力先は遊びと休憩で別に選べる。
    Finish(TimerKind),
    /// まもなく終了。短い3連ビープ。
    Warning,
    /// 20-20-20。上昇する3音チャイム。
    EyeBreak,
    /// 制限時刻の通過。長く続く不規則ビープ。
    Alarm,
    /// 進化・開花。1秒の不規則ビープ。
    Evolved,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum Surface {
    /// 鳴っている間だけ前面に出す。
    Alarm,
    /// 次のタイマーを始めるまで、閉じられない最前面にする。
    Keep,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum Effect {
    Notice(Notice),
    Sound(Sound),
    Surface(Surface),
    /// 最前面を解除する。`force` なら閉じられる状態にもする。
    ReleaseAlwaysOnTop {
        force: bool,
    },
    /// 終了時刻の「やめた」を受けて、PC をスリープさせる。
    SleepNow,
}
