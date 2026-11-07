//! 通知の文言。ドメインは「何を知らせるか」（`Notice`）だけを返し、
//! 利用者に見せる言葉はここで決める。

use crate::domain::effects::{Boundary, Notice};
#[cfg(test)]
use crate::domain::growth::Flower;
use crate::domain::timer::TimerKind;

pub struct ToastText {
    pub title: String,
    pub body: String,
}

fn kind_label(kind: TimerKind) -> &'static str {
    match kind {
        TimerKind::Play => "遊び",
        TimerKind::Break => "休憩",
    }
}

fn text(title: impl Into<String>, body: impl Into<String>) -> ToastText {
    ToastText {
        title: title.into(),
        body: body.into(),
    }
}

pub fn toast_text(notice: Notice) -> ToastText {
    match notice {
        Notice::TimerFinished(kind) => {
            text(format!("{} が終わりました", kind_label(kind)), "お疲れさまでした！")
        }
        Notice::TimerWarning { kind, minutes } => text(
            format!("{} まもなく終了", kind_label(kind)),
            format!("残り{minutes}分です"),
        ),
        Notice::EyeBreak => text(
            "20-20-20ルール",
            "20秒間、20フィート（約6m）先を見て目を休めましょう👀",
        ),
        Notice::Boundary {
            boundary,
            stopped_play,
        } => match boundary {
            Boundary::LunchStart => text(
                "昼休憩の時間になりました",
                if stopped_play {
                    "遊びを終了します。お疲れさまでした！"
                } else {
                    "休憩しよう！"
                },
            ),
            Boundary::EndTime => text(
                "終了の時間になりました",
                if stopped_play {
                    "遊びを終了します。お疲れさまでした！"
                } else {
                    "今日はここまで。お疲れさまでした！"
                },
            ),
            Boundary::LunchEnd => text("昼休憩が終わりました", "また遊べるよ！"),
        },
        Notice::Evolved => text("進化した！✨", "くまもーるんが育ったよ！"),
        Notice::Bloomed { flower } => text(
            "お花が咲いた！🌸",
            format!("{} が咲きました！お花+{}", flower.name(), flower.gain()),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pair(notice: Notice) -> (String, String) {
        let t = toast_text(notice);
        (t.title, t.body)
    }

    #[test]
    fn 時間切れ() {
        assert_eq!(
            pair(Notice::TimerFinished(TimerKind::Play)),
            ("遊び が終わりました".into(), "お疲れさまでした！".into())
        );
        assert_eq!(
            pair(Notice::TimerFinished(TimerKind::Break)),
            ("休憩 が終わりました".into(), "お疲れさまでした！".into())
        );
    }

    #[test]
    fn まもなく終了() {
        assert_eq!(
            pair(Notice::TimerWarning {
                kind: TimerKind::Play,
                minutes: 5
            }),
            ("遊び まもなく終了".into(), "残り5分です".into())
        );
    }

    #[test]
    fn 目の休憩() {
        assert_eq!(
            pair(Notice::EyeBreak),
            (
                "20-20-20ルール".into(),
                "20秒間、20フィート（約6m）先を見て目を休めましょう👀".into()
            )
        );
    }

    #[test]
    fn 昼休憩の開始() {
        assert_eq!(
            pair(Notice::Boundary {
                boundary: Boundary::LunchStart,
                stopped_play: false
            }),
            ("昼休憩の時間になりました".into(), "休憩しよう！".into())
        );
        assert_eq!(
            pair(Notice::Boundary {
                boundary: Boundary::LunchStart,
                stopped_play: true
            }),
            (
                "昼休憩の時間になりました".into(),
                "遊びを終了します。お疲れさまでした！".into()
            )
        );
    }

    #[test]
    fn 終了時刻() {
        assert_eq!(
            pair(Notice::Boundary {
                boundary: Boundary::EndTime,
                stopped_play: false
            }),
            (
                "終了の時間になりました".into(),
                "今日はここまで。お疲れさまでした！".into()
            )
        );
        assert_eq!(
            pair(Notice::Boundary {
                boundary: Boundary::EndTime,
                stopped_play: true
            }),
            (
                "終了の時間になりました".into(),
                "遊びを終了します。お疲れさまでした！".into()
            )
        );
    }

    #[test]
    fn 進化と開花() {
        assert_eq!(
            pair(Notice::Evolved),
            ("進化した！✨".into(), "くまもーるんが育ったよ！".into())
        );
        assert_eq!(
            pair(Notice::Bloomed {
                flower: Flower::NightCherry
            }),
            (
                "お花が咲いた！🌸".into(),
                "夜桜 が咲きました！お花+2".into()
            )
        );
        assert_eq!(
            pair(Notice::Bloomed {
                flower: Flower::Peony
            }),
            ("お花が咲いた！🌸".into(), "ボタン が咲きました！お花+1".into())
        );
    }

    #[test]
    fn 昼休憩の終了() {
        assert_eq!(
            pair(Notice::Boundary {
                boundary: Boundary::LunchEnd,
                stopped_play: false
            }),
            ("昼休憩が終わりました".into(), "また遊べるよ！".into())
        );
    }
}
