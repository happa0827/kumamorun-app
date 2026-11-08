//! スタート制限を書き換えたときの、閉じられるかどうかの切り替え。
//!
//! 変えた時刻がもう過ぎていれば、その境界を通過した状態なので閉じられなくする。
//! これから来る時刻なら、閉じられるようにする。

use chrono::{NaiveDateTime, NaiveTime, Timelike};

use crate::domain::effects::{Effect, Surface};
use crate::domain::restrictions::{DayRestriction, Restrictions};

use super::Engine;

fn fields(day: &DayRestriction) -> [Option<NaiveTime>; 3] {
    [day.lunch_start, day.lunch_end, day.end_time]
}

/// 変わった時刻（新しい値）。空にした場合は `None` として含む。平日と週末の両方を見る。
fn changed_times(prev: &Restrictions, next: &Restrictions) -> Vec<Option<NaiveTime>> {
    let pairs = [
        (&prev.weekday, &next.weekday),
        (&prev.weekend, &next.weekend),
    ];
    pairs
        .into_iter()
        .flat_map(|(old, new)| {
            fields(old)
                .into_iter()
                .zip(fields(new))
                .filter(|(old, new)| old != new)
                .map(|(_, new)| new)
        })
        .collect()
}

impl Engine {
    /// 利用者がスタート制限を書き換えた。書き換えただけで境界を通過したとはみなさず、
    /// 前面の固定をどうするかを返す。
    pub fn edit_restrictions(&mut self, next: Restrictions, now: NaiveDateTime) -> Vec<Effect> {
        let prev = self.restrictions.clone();
        self.set_restrictions(next, now);
        let changed = changed_times(&prev, &self.restrictions);
        if changed.is_empty() {
            return Vec::new();
        }
        // 昼休憩中は閉じられる（開始時刻が今より前でも固定しない）。
        if self.restrictions.lunch_remaining(now).is_some() {
            return vec![Effect::ReleaseAlwaysOnTop { force: true }];
        }
        let minute = now
            .time()
            .with_second(0)
            .and_then(|time| time.with_nanosecond(0))
            .unwrap_or(now.time());
        if changed.iter().flatten().any(|time| *time <= minute) {
            vec![Effect::Surface(Surface::Keep)]
        } else {
            vec![Effect::ReleaseAlwaysOnTop { force: true }]
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::NaiveDate;

    use crate::domain::restrictions::{DayForm, RestrictionsForm};

    use super::*;

    // 2026-11-09 は月曜日、2026-11-14 は土曜日。
    fn at(day: u32, h: u32, m: u32, s: u32) -> NaiveDateTime {
        NaiveDate::from_ymd_opt(2026, 11, day)
            .unwrap()
            .and_hms_opt(h, m, s)
            .unwrap()
    }

    fn day(lunch_start: &str, lunch_end: &str, end_time: &str) -> DayForm {
        DayForm {
            lunch_start: lunch_start.into(),
            lunch_end: lunch_end.into(),
            end_time: end_time.into(),
        }
    }

    fn restrictions(weekday: DayForm, weekend: DayForm) -> Restrictions {
        (&RestrictionsForm { weekday, weekend }).into()
    }

    fn engine_with(weekday: DayForm, weekend: DayForm, now: NaiveDateTime) -> Engine {
        let mut engine = Engine::new(now);
        engine.set_restrictions(restrictions(weekday, weekend), now);
        engine
    }

    const KEEP: Effect = Effect::Surface(Surface::Keep);
    const RELEASE: Effect = Effect::ReleaseAlwaysOnTop { force: true };

    #[test]
    fn 変更が無ければ何もしない() {
        let now = at(9, 12, 0, 0);
        let mut e = engine_with(day("", "", "18:00"), day("", "", ""), now);
        let same = restrictions(day("", "", "18:00"), day("", "", ""));
        assert_eq!(e.edit_restrictions(same, now), vec![]);
    }

    #[test]
    fn 変えた時刻がもう過ぎていれば_閉じられなくする() {
        let now = at(9, 12, 0, 0);
        let mut e = engine_with(day("", "", ""), day("", "", ""), now);
        let next = restrictions(day("", "", "10:00"), day("", "", ""));
        assert_eq!(e.edit_restrictions(next, now), vec![KEEP]);
    }

    #[test]
    fn 変えた時刻がこれから来るなら_閉じられるようにする() {
        let now = at(9, 12, 0, 0);
        let mut e = engine_with(day("", "", "10:00"), day("", "", ""), now);
        let next = restrictions(day("", "", "18:00"), day("", "", ""));
        assert_eq!(e.edit_restrictions(next, now), vec![RELEASE]);
    }

    #[test]
    fn ちょうど今の時刻は過ぎたものとして扱う() {
        let now = at(9, 12, 0, 30);
        let mut e = engine_with(day("", "", ""), day("", "", ""), now);
        let next = restrictions(day("", "", "12:00"), day("", "", ""));
        assert_eq!(e.edit_restrictions(next, now), vec![KEEP]);
        let mut e = engine_with(day("", "", ""), day("", "", ""), now);
        let next = restrictions(day("", "", "12:01"), day("", "", ""));
        assert_eq!(e.edit_restrictions(next, now), vec![RELEASE]);
    }

    #[test]
    fn 昼休憩中になる設定は_開始時刻が過ぎていても閉じられる() {
        let now = at(9, 12, 30, 0);
        let mut e = engine_with(day("", "", ""), day("", "", ""), now);
        let next = restrictions(day("12:00", "13:00", ""), day("", "", ""));
        assert_eq!(e.edit_restrictions(next, now), vec![RELEASE]);
    }

    #[test]
    fn 時刻を空にしただけなら_閉じられるようにする() {
        let now = at(9, 12, 0, 0);
        let mut e = engine_with(day("", "", "10:00"), day("", "", ""), now);
        let next = restrictions(day("", "", ""), day("", "", ""));
        assert_eq!(e.edit_restrictions(next, now), vec![RELEASE]);
    }

    #[test]
    fn 今日の種類でない側_週末を変えても見る() {
        let now = at(9, 12, 0, 0); // 月曜日
        let mut e = engine_with(day("", "", ""), day("", "", ""), now);
        let next = restrictions(day("", "", ""), day("", "", "09:00"));
        assert_eq!(e.edit_restrictions(next, now), vec![KEEP]);
    }

    #[test]
    fn 複数変えて_1つでも過ぎていれば閉じられなくする() {
        let now = at(9, 12, 0, 0);
        let mut e = engine_with(day("", "", ""), day("", "", ""), now);
        let next = restrictions(day("", "", "18:00"), day("", "", "09:00"));
        assert_eq!(e.edit_restrictions(next, now), vec![KEEP]);
    }

    #[test]
    fn 書き換えただけでは境界を通過したとはみなさない() {
        let now = at(9, 12, 0, 0);
        let mut e = engine_with(day("", "", ""), day("", "", ""), now);
        e.edit_restrictions(restrictions(day("", "", "10:00"), day("", "", "")), now);
        // 直後の tick で、過ぎた 10:00 の境界が鳴らない。
        let effects = e.tick(at(9, 12, 0, 1));
        assert!(
            !effects
                .iter()
                .any(|effect| matches!(effect, Effect::Notice(_) | Effect::Sound(_))),
            "{effects:?}"
        );
    }
}
