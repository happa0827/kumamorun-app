//! トースト窓の配置。Electron 版（toast-place.js）のテストを移したもの。

use super::*;

const SHADOW_PAD: Pad = Pad {
    top: 60.0,
    right: 60.0,
    bottom: 60.0,
    left: 60.0,
};

fn rect(x: f64, y: f64, width: f64, height: f64) -> Rect {
    Rect {
        x,
        y,
        width,
        height,
    }
}

fn options(work: Rect, displays: Vec<Rect>) -> PlaceOptions {
    PlaceOptions {
        pad: SHADOW_PAD,
        card: None,
        display_bounds: work,
        displays,
    }
}

/// 作業領域の右端・下端からカードまでの距離。
fn card_edge_offset(work: Rect, placed: &Placed) -> (f64, f64) {
    (
        work.x + work.width - (placed.card.x + placed.card.width),
        work.y + work.height - (placed.card.y + placed.card.height),
    )
}

#[test]
fn 影が画面の外へ出せるとき_カードの縁は作業領域から16px() {
    let work = rect(0.0, 0.0, 1920.0, 1080.0);
    let placed = place_toast_window(
        work,
        Size {
            width: 600.0,
            height: 280.0,
        },
        options(work, vec![work]),
    );
    assert_eq!(card_edge_offset(work, &placed), (16.0, 16.0));
    assert_eq!(placed.x + placed.width, 1920.0 - 16.0 + 60.0);
    assert_eq!(placed.y + placed.height, 1080.0 - 16.0 + 60.0);
    assert_eq!(placed.width, 600.0);
    assert_eq!(placed.height, 280.0);
}

#[test]
fn 切り上げた窓でも_測ったカードの縁を16pxに置く() {
    let work = rect(0.0, 0.0, 1951.0, 1220.0);
    let mut opts = options(work, vec![work]);
    opts.card = Some(CardBox {
        x: 60.0,
        y: 60.0,
        right: 540.0,
        bottom: 276.698425,
    });
    let placed = place_toast_window(
        work,
        Size {
            width: 601.0,
            height: 337.0,
        },
        opts,
    );
    let (right, bottom) = card_edge_offset(work, &placed);
    assert_eq!(right, 16.0);
    assert!((bottom - 16.0).abs() < 0.5);
    assert_eq!(placed.x, 1395.0);
}

#[test]
fn ウィンドウマネージャーの1pxのずれは要求した位置へ足し戻す() {
    assert_eq!(
        nudge_bounds(
            rect(1395.0, 927.0, 601.0, 337.0),
            rect(1394.0, 926.0, 603.0, 339.0)
        ),
        rect(1396.0, 928.0, 599.0, 335.0)
    );
    // 大きく押し戻されたときは足さない（隣のディスプレイへ押し出さない）。
    assert_eq!(
        nudge_bounds(
            rect(1395.0, 927.0, 601.0, 337.0),
            rect(1350.0, 927.0, 601.0, 337.0)
        ),
        rect(1395.0, 927.0, 601.0, 337.0)
    );
}

#[test]
fn 右へはみ出すと隣のディスプレイに入るなら余白を削る() {
    let work = rect(0.0, 0.0, 1920.0, 1080.0);
    let beside = rect(1920.0, 0.0, 1920.0, 1080.0);
    let placed = place_toast_window(
        work,
        Size {
            width: 600.0,
            height: 280.0,
        },
        options(work, vec![work, beside]),
    );
    assert_eq!(card_edge_offset(work, &placed), (16.0, 16.0));
    assert_eq!(placed.x + placed.width, 1920.0);
    assert!(placed.x + placed.width <= beside.x);
    assert_eq!(placed.y + placed.height, 1080.0 - 16.0 + 60.0);
}

#[test]
fn 下へはみ出すと隣のディスプレイに入るなら余白を削る() {
    let work = rect(100.0, 40.0, 1600.0, 900.0);
    let display = rect(100.0, 0.0, 1600.0, 980.0);
    let below = rect(100.0, 980.0, 1600.0, 900.0);
    let placed = place_toast_window(
        work,
        Size {
            width: 600.0,
            height: 280.0,
        },
        options(display, vec![display, below]),
    );
    assert_eq!(card_edge_offset(work, &placed), (16.0, 16.0));
    assert_eq!(placed.y + placed.height, display.y + display.height);
    assert!(placed.y + placed.height <= below.y);
    assert_eq!(placed.x + placed.width, work.x + work.width - 16.0 + 60.0);
}

#[test]
fn 画面の上側にある別のディスプレイは右下のカードを内側へ引かない() {
    let work = rect(0.0, 0.0, 1920.0, 1080.0);
    let upper_right = rect(1920.0, 0.0, 800.0, 200.0);
    let placed = place_toast_window(
        work,
        Size {
            width: 600.0,
            height: 280.0,
        },
        options(work, vec![work, upper_right]),
    );
    assert_eq!(card_edge_offset(work, &placed), (16.0, 16.0));
    assert_eq!(placed.width, 600.0);
}

#[test]
fn 作業領域より大きいカードでも右と下は16px空ける() {
    let work = rect(0.0, 0.0, 200.0, 100.0);
    let mut opts = options(work, vec![work]);
    opts.pad = Pad::default();
    let placed = place_toast_window(
        work,
        Size {
            width: 500.2,
            height: 400.0,
        },
        opts,
    );
    assert_eq!(card_edge_offset(work, &placed), (16.0, 16.0));
}

// ---- カーソルがどのカードの上にあるか ----

fn card(id: u32, left: f64, top: f64, right: f64, bottom: f64) -> CardRect {
    CardRect {
        id,
        left,
        top,
        right,
        bottom,
    }
}

#[test]
fn カードの上にカーソルがあればそのカードを返す() {
    let cards = [
        card(1, 60.0, 60.0, 540.0, 160.0),
        card(2, 60.0, 170.0, 540.0, 270.0),
    ];
    // 窓の左上が画面の (1000, 500)、拡大率1。
    let origin = (1000.0, 500.0);
    assert_eq!(card_at((1100.0, 600.0), origin, 1.0, &cards), Some(1));
    assert_eq!(card_at((1100.0, 700.0), origin, 1.0, &cards), Some(2));
}

#[test]
fn カードとカードの隙間や外では何も返さない() {
    let cards = [
        card(1, 60.0, 60.0, 540.0, 160.0),
        card(2, 60.0, 170.0, 540.0, 270.0),
    ];
    let origin = (1000.0, 500.0);
    assert_eq!(card_at((1100.0, 665.0), origin, 1.0, &cards), None); // 隙間
    assert_eq!(card_at((1010.0, 510.0), origin, 1.0, &cards), None); // 影の余白
    assert_eq!(card_at((10.0, 10.0), origin, 1.0, &cards), None); // 窓の外
}

#[test]
fn カードの左と上の縁は含み_右と下の縁は含まない() {
    let cards = [card(1, 60.0, 60.0, 540.0, 160.0)];
    let origin = (0.0, 0.0);
    assert_eq!(card_at((60.0, 60.0), origin, 1.0, &cards), Some(1));
    assert_eq!(card_at((539.0, 159.0), origin, 1.0, &cards), Some(1));
    assert_eq!(card_at((540.0, 100.0), origin, 1.0, &cards), None);
    assert_eq!(card_at((100.0, 160.0), origin, 1.0, &cards), None);
}

#[test]
fn 画面の拡大率を掛けて判定する() {
    // CSS px のカード (60..540, 60..160) は、拡大率1.5の画面では物理 px で 90..810, 90..240。
    let cards = [card(1, 60.0, 60.0, 540.0, 160.0)];
    let origin = (1000.0, 500.0);
    assert_eq!(card_at((1090.0, 590.0), origin, 1.5, &cards), Some(1));
    assert_eq!(card_at((1089.0, 590.0), origin, 1.5, &cards), None);
    assert_eq!(card_at((1809.0, 739.0), origin, 1.5, &cards), Some(1));
    assert_eq!(card_at((1811.0, 739.0), origin, 1.5, &cards), None);
}

#[test]
fn カードがなければ何も返さない() {
    assert_eq!(card_at((0.0, 0.0), (0.0, 0.0), 1.0, &[]), None);
}
