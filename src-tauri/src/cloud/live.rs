//! ライブ状況を書く頻度の規則。変化があったときと、変化がなくても20秒ごと
//! （ハートビート。サイトは最後の書き込みから60秒を超えたら停止とみなす）。毎秒は書かない。

use crate::domain::engine::live_status::LiveStatus;

/// 変化がなくても、この間隔で書く。サイトの停止判定（60秒）の3分の1。
pub const HEARTBEAT_MS: i64 = 20_000;

/// 残り秒と `blockReason` 以外の変化を見分ける印。
fn fingerprint(status: &LiveStatus) -> String {
    let week = status.week.as_ref().map(|days| {
        days.iter()
            .map(|d| format!("{}:{}:{}", d.date, d.plays, d.failures))
            .collect::<Vec<_>>()
            .join(",")
    });
    format!(
        "{}|{}|{}|{}|{:?}|{:?}|{}|{:?}|{:?}",
        status.phase,
        status.label,
        status.running,
        status.keeping,
        status.started_at,
        status.duration,
        status.start_blocked,
        status.daily,
        week,
    )
}

#[derive(Debug, Default)]
pub struct LiveThrottle {
    last_fingerprint: Option<String>,
    last_write_ms: i64,
}

impl LiveThrottle {
    /// 今書くべきなら true を返し、書いたものとして数え直す。
    pub fn should_write(&mut self, status: &LiveStatus, now_ms: i64) -> bool {
        let print = fingerprint(status);
        let changed = self.last_fingerprint.as_deref() != Some(print.as_str());
        let due = now_ms - self.last_write_ms >= HEARTBEAT_MS;
        if !changed && !due {
            return false;
        }
        self.last_fingerprint = Some(print);
        self.last_write_ms = now_ms;
        true
    }

    /// 書けなかったときに、次も書くようにする。
    pub fn reset(&mut self) {
        *self = Self::default();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::engine::live_status::DailyEntry;

    fn play(remaining: i64) -> LiveStatus {
        LiveStatus {
            phase: "play".into(),
            label: "遊び".into(),
            running: true,
            keeping: true,
            remaining_sec: Some(remaining),
            started_at: Some(1_000),
            duration: Some(900),
            ..LiveStatus::offline()
        }
    }

    #[test]
    fn 最初は必ず書く() {
        let mut throttle = LiveThrottle::default();
        assert!(throttle.should_write(&play(900), 1_000_000));
    }

    #[test]
    fn 残り秒だけの変化では_ハートビートまで書かない() {
        let mut throttle = LiveThrottle::default();
        assert!(throttle.should_write(&play(900), 1_000_000));
        assert!(!throttle.should_write(&play(899), 1_001_000));
        assert!(!throttle.should_write(&play(881), 1_019_000));
        assert!(throttle.should_write(&play(880), 1_020_000));
    }

    #[test]
    fn 状態が変われば_すぐ書く() {
        let mut throttle = LiveThrottle::default();
        assert!(throttle.should_write(&play(900), 1_000_000));
        let mut paused = play(800);
        paused.phase = "paused".into();
        paused.running = false;
        assert!(throttle.should_write(&paused, 1_001_000));
    }

    #[test]
    fn 記録が変われば_すぐ書く() {
        let mut throttle = LiveThrottle::default();
        let mut status = play(900);
        assert!(throttle.should_write(&status, 1_000_000));
        status.daily = Some(DailyEntry {
            date: "2026-11-09".into(),
            plays: 1,
            failures: 0,
        });
        assert!(throttle.should_write(&status, 1_001_000));
    }

    #[test]
    fn リセットすると次は必ず書く() {
        let mut throttle = LiveThrottle::default();
        assert!(throttle.should_write(&play(900), 1_000_000));
        assert!(!throttle.should_write(&play(899), 1_001_000));
        throttle.reset();
        assert!(throttle.should_write(&play(898), 1_002_000));
    }
}
