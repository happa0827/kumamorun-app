use super::*;

#[test]
fn 時間切れで固定するとミニを閉じて前面に出す() {
    let mut pin = Pin::default();
    assert_eq!(
        pin.surface(Surface::Keep),
        vec![PinAction::CloseMini, PinAction::ShowPinned]
    );
    assert!(pin.is_pinned());
}

#[test]
fn アラームの固定は解除できる() {
    let mut pin = Pin::default();
    pin.surface(Surface::Alarm);
    assert!(pin.is_pinned());
    assert_eq!(pin.release(false), vec![PinAction::Unpin]);
    assert!(!pin.is_pinned());
}

#[test]
fn 時間切れの固定はアラームの解除では外れない() {
    let mut pin = Pin::default();
    pin.surface(Surface::Keep);
    assert!(pin.release(false).is_empty());
    assert!(pin.is_pinned());
    assert_eq!(pin.release(true), vec![PinAction::Unpin]);
    assert!(!pin.is_pinned());
}

#[test]
fn 時間切れの固定中にアラームが来ても固定は保たれる() {
    let mut pin = Pin::default();
    pin.surface(Surface::Keep);
    pin.surface(Surface::Alarm);
    assert!(pin.release(false).is_empty());
    assert!(pin.is_pinned());
}

#[test]
fn アラームの後に時間切れの固定が来たら固定に変わる() {
    let mut pin = Pin::default();
    pin.surface(Surface::Alarm);
    pin.surface(Surface::Keep);
    assert!(pin.release(false).is_empty());
    assert!(pin.is_pinned());
}

#[test]
fn 強制の解除は何も固定していなくても全画面を戻す() {
    let mut pin = Pin::default();
    assert_eq!(pin.release(true), vec![PinAction::Unpin]);
}

#[test]
fn 固定していなくても通常の解除は全画面を戻す() {
    // 集中モード（全画面）の最中にアラームが鳴り終わった場合も、元の大きさに戻す。
    let mut pin = Pin::default();
    assert_eq!(pin.release(false), vec![PinAction::Unpin]);
}

#[test]
fn 閉じる操作は通常はトレイへ隠す() {
    let mut pin = Pin::default();
    assert_eq!(pin.on_close_requested(), CloseDecision::Hide);
}

#[test]
fn 固定中は閉じる操作でも前面に残す() {
    let mut pin = Pin::default();
    pin.surface(Surface::Keep);
    assert_eq!(pin.on_close_requested(), CloseDecision::KeepVisible);
}

#[test]
fn 終了の操作なら閉じる() {
    let mut pin = Pin::default();
    pin.surface(Surface::Keep);
    pin.quitting();
    assert_eq!(pin.on_close_requested(), CloseDecision::Allow);
}

#[test]
fn 固定中に最小化されたらすぐ戻す() {
    let mut pin = Pin::default();
    assert_eq!(pin.on_minimized(), None);
    pin.surface(Surface::Keep);
    assert_eq!(pin.on_minimized(), Some(PinAction::ShowPinned));
}

#[test]
fn 固定中はミニを開かない() {
    let mut pin = Pin::default();
    assert!(pin.mini_allowed());
    pin.surface(Surface::Alarm);
    assert!(!pin.mini_allowed());
    pin.release(false);
    assert!(pin.mini_allowed());
}
