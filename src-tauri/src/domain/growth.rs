//! 育成。進化段階の進め方と、開花で咲く花の抽選。
//! Firebase への反映（トランザクション）は同期層の仕事で、ここは純粋な計算だけを持つ。

use serde::{Deserialize, Serialize};

/// この回数の進化で開花する。進化段階は 0〜5 で、5 の次の進化が開花。
pub const EVOLVE_MAX: u32 = 6;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Flower {
    /// 07 タンポポ
    Dandelion,
    /// 08 ボタン
    Peony,
    /// 09 青いヒガンバナ
    BlueSpiderLily,
    /// 11 夜桜（1%）
    NightCherry,
}

impl Flower {
    /// 画面が画像を選ぶための名前。
    pub fn key(self) -> &'static str {
        match self {
            Flower::Dandelion => "dandelion",
            Flower::Peony => "peony",
            Flower::BlueSpiderLily => "blueSpiderLily",
            Flower::NightCherry => "nightCherry",
        }
    }

    /// 利用者に見せる名前。
    pub fn name(self) -> &'static str {
        match self {
            Flower::Dandelion => "タンポポ",
            Flower::Peony => "ボタン",
            Flower::BlueSpiderLily => "青いヒガンバナ",
            Flower::NightCherry => "夜桜",
        }
    }

    /// 獲得できる花の数。夜桜だけ 2。
    pub fn gain(self) -> u32 {
        match self {
            Flower::NightCherry => 2,
            _ => 1,
        }
    }
}

/// 抽選。`roll` は 0以上100未満。タンポポ・ボタン・青いヒガンバナが各33%、夜桜が1%。
pub fn pick_flower(roll: f64) -> Flower {
    if roll < 33.0 {
        Flower::Dandelion
    } else if roll < 66.0 {
        Flower::Peony
    } else if roll < 99.0 {
        Flower::BlueSpiderLily
    } else {
        Flower::NightCherry
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Evolution {
    /// 進化段階が上がった。
    Grew { stage: u32 },
    /// 開花した。進化段階は 0 に戻る。
    Bloomed { flower: Flower },
}

/// 進化段階を1つ進める。上限に達したら開花し、`roll` で花を決める。
/// `roll` は開花するときだけ使う。
pub fn evolve(current: u32, roll: f64) -> Evolution {
    let next = current + 1;
    if next >= EVOLVE_MAX {
        Evolution::Bloomed {
            flower: pick_flower(roll),
        }
    } else {
        Evolution::Grew { stage: next }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn 進化段階が1つ上がる() {
        assert_eq!(evolve(0, 0.0), Evolution::Grew { stage: 1 });
        assert_eq!(evolve(4, 0.0), Evolution::Grew { stage: 5 });
    }

    #[test]
    fn 段階5の次の進化で開花する() {
        assert!(matches!(evolve(5, 0.0), Evolution::Bloomed { .. }));
    }

    #[test]
    fn 仕様変更前の段階6も開花として扱う() {
        assert!(matches!(evolve(6, 0.0), Evolution::Bloomed { .. }));
    }

    #[test]
    fn 開花しないときは乱数を使わない() {
        assert_eq!(evolve(2, 99.9), Evolution::Grew { stage: 3 });
    }

    #[test]
    fn 抽選の境界() {
        assert_eq!(pick_flower(0.0), Flower::Dandelion);
        assert_eq!(pick_flower(32.9), Flower::Dandelion);
        assert_eq!(pick_flower(33.0), Flower::Peony);
        assert_eq!(pick_flower(65.9), Flower::Peony);
        assert_eq!(pick_flower(66.0), Flower::BlueSpiderLily);
        assert_eq!(pick_flower(98.9), Flower::BlueSpiderLily);
        assert_eq!(pick_flower(99.0), Flower::NightCherry);
        assert_eq!(pick_flower(99.9), Flower::NightCherry);
    }

    #[test]
    fn 夜桜だけ花を2つ獲得する() {
        assert_eq!(Flower::Dandelion.gain(), 1);
        assert_eq!(Flower::Peony.gain(), 1);
        assert_eq!(Flower::BlueSpiderLily.gain(), 1);
        assert_eq!(Flower::NightCherry.gain(), 2);
    }

    #[test]
    fn 花の名前と画面用のキー() {
        assert_eq!(Flower::Dandelion.name(), "タンポポ");
        assert_eq!(Flower::Peony.name(), "ボタン");
        assert_eq!(Flower::BlueSpiderLily.name(), "青いヒガンバナ");
        assert_eq!(Flower::NightCherry.name(), "夜桜");
        assert_eq!(Flower::NightCherry.key(), "nightCherry");
    }

    #[test]
    fn 開花で咲く花は乱数で決まる() {
        assert_eq!(
            evolve(5, 99.5),
            Evolution::Bloomed {
                flower: Flower::NightCherry
            }
        );
    }
}
