//! トースト窓の配置と、カーソルがどのカードの上にあるかの判定。
//! Electron 版の toast-place.js を移したもの。座標はすべて物理ピクセル（カードの枠は CSS px）。

use serde::Deserialize;

/// 作業領域の右端・下端からカードの縁までの余白。
pub const TOAST_MARGIN: f64 = 16.0;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

/// 影を逃がすための、カードの外側の余白。
#[derive(Debug, Clone, Copy, Default)]
pub struct Pad {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

/// 窓の中でのカードの範囲。
#[derive(Debug, Clone, Copy)]
pub struct CardBox {
    pub x: f64,
    pub y: f64,
    pub right: f64,
    pub bottom: f64,
}

pub struct PlaceOptions {
    pub pad: Pad,
    /// 測ったカードの範囲。なければ余白から割り出す。
    pub card: Option<CardBox>,
    /// この窓が載るディスプレイ全体の範囲。
    pub display_bounds: Rect,
    /// すべてのディスプレイの範囲。
    pub displays: Vec<Rect>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Placed {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub card: Rect,
}

/// JavaScript の `Math.round` と同じ丸め（.5 は切り上げ）。
fn js_round(value: f64) -> f64 {
    (value + 0.5).floor()
}

fn overlaps(a: Rect, b: Rect) -> bool {
    a.width > 0.0
        && a.height > 0.0
        && b.width > 0.0
        && b.height > 0.0
        && a.x < b.x + b.width
        && a.x + a.width > b.x
        && a.y < b.y + b.height
        && a.y + a.height > b.y
}

fn hits_another_display(rect: Rect, display_bounds: Rect, displays: &[Rect]) -> bool {
    displays
        .iter()
        .any(|bounds| *bounds != display_bounds && overlaps(rect, *bounds))
}

/// カードの右端・下端を作業領域から `TOAST_MARGIN` に置く。
/// 影の余白は画面の外へ出してよいが、隣のディスプレイに入る分だけ余白を削る。
pub fn place_toast_window(work_area: Rect, size: Size, options: PlaceOptions) -> Placed {
    let pad = Pad {
        top: options.pad.top.max(0.0),
        right: options.pad.right.max(0.0),
        bottom: options.pad.bottom.max(0.0),
        left: options.pad.left.max(0.0),
    };
    let width = size.width.ceil().max(1.0);
    let height = size.height.ceil().max(1.0);
    let card = match options.card {
        Some(card) if card.right > 0.0 && card.bottom > 0.0 => card,
        _ => CardBox {
            x: pad.left,
            y: pad.top,
            right: (pad.left + 1.0).max(width - pad.right),
            bottom: (pad.top + 1.0).max(height - pad.bottom),
        },
    };

    let work_right = work_area.x + work_area.width;
    let work_bottom = work_area.y + work_area.height;
    let x = js_round(work_right - TOAST_MARGIN - card.right);
    let y = js_round(work_bottom - TOAST_MARGIN - card.bottom);
    let mut w = width;
    let mut h = height;

    let display = options.display_bounds;
    let display_right = display.x + display.width;
    let display_bottom = display.y + display.height;
    let min_width = card.right.ceil().max(1.0);
    let min_height = card.bottom.ceil().max(1.0);

    let right_overflow = Rect {
        x: display_right,
        y,
        width: (x + w - display_right).max(0.0),
        height: h,
    };
    if hits_another_display(right_overflow, display, &options.displays) {
        w = min_width.max(display_right - x);
    }
    let bottom_overflow = Rect {
        x,
        y: display_bottom,
        width: w,
        height: (y + h - display_bottom).max(0.0),
    };
    if hits_another_display(bottom_overflow, display, &options.displays) {
        h = min_height.max(display_bottom - y);
    }

    Placed {
        x,
        y,
        width: w,
        height: h,
        card: Rect {
            x: x + card.x,
            y: y + card.y,
            width: card.right - card.x,
            height: card.bottom - card.y,
        },
    }
}

/// `set_bounds` が数 px ずれるとき、同じずれを足して要求した位置に戻す。
/// 画面内へ大きく押し戻された場合は足さない（隣のディスプレイへ押し出さない）。
pub fn nudge_bounds(requested: Rect, actual: Rect) -> Rect {
    let dx = requested.x - actual.x;
    let dy = requested.y - actual.y;
    let dw = requested.width - actual.width;
    let dh = requested.height - actual.height;
    if [dx, dy, dw, dh].iter().all(|delta| delta.abs() <= 4.0) {
        Rect {
            x: requested.x + dx,
            y: requested.y + dy,
            width: requested.width + dw,
            height: requested.height + dh,
        }
    } else {
        requested
    }
}

/// WebView が測ったカード1枚の範囲（窓の中、CSS px）。
#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
pub struct CardRect {
    pub id: u32,
    pub left: f64,
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
}

/// カーソルが載っているカードの `id`。
/// `cursor` は画面の物理座標、`origin` は窓の内側の左上（画面の物理座標）、
/// `scale` は CSS px から物理 px への倍率。左と上の縁は含み、右と下の縁は含まない。
pub fn card_at(
    cursor: (f64, f64),
    origin: (f64, f64),
    scale: f64,
    cards: &[CardRect],
) -> Option<u32> {
    cards
        .iter()
        .find(|card| {
            let left = origin.0 + card.left * scale;
            let top = origin.1 + card.top * scale;
            let right = origin.0 + card.right * scale;
            let bottom = origin.1 + card.bottom * scale;
            cursor.0 >= left && cursor.0 < right && cursor.1 >= top && cursor.1 < bottom
        })
        .map(|card| card.id)
}

#[cfg(test)]
mod tests;
