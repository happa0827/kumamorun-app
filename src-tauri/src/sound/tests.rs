use super::*;

const RATE: u32 = 44_100;

fn one(freq: f64, at: f64, dur: f64, wave: Wave, volume: f64) -> Note {
    Note {
        freq,
        at,
        dur,
        wave,
        volume,
    }
}

/// 決まった順に値を返す乱数の代わり。
fn sequence(values: Vec<f64>) -> impl FnMut() -> f64 {
    let mut i = 0;
    move || {
        let v = values[i % values.len()];
        i += 1;
        v
    }
}

fn peak(samples: &[f32]) -> f32 {
    samples.iter().fold(0.0, |m, s| m.max(s.abs()))
}

#[test]
fn 音の長さだけのサンプルができる() {
    let out = render(&[one(440.0, 0.0, 0.5, Wave::Sine, 0.7)], RATE);
    assert_eq!(out.len(), (0.5 * f64::from(RATE)) as usize);
}

#[test]
fn 音が無ければ空() {
    assert!(render(&[], RATE).is_empty());
}

#[test]
fn 出だしと終わりは0に近く_プツッというノイズが出ない() {
    let out = render(&[one(440.0, 0.0, 0.5, Wave::Square, 0.7)], RATE);
    assert_eq!(out[0], 0.0);
    assert!(out[out.len() - 1].abs() < 0.05);
    // 途中は最大音量に届く。
    assert!((peak(&out) - 0.7).abs() < 0.01);
}

#[test]
fn 正弦波は1秒に周波数と同じ回数だけ波を打つ() {
    let out = render(&[one(440.0, 0.0, 1.0, Wave::Sine, 0.7)], RATE);
    let rising = out
        .windows(2)
        .filter(|pair| pair[0] < 0.0 && pair[1] >= 0.0)
        .count();
    assert!((439..=441).contains(&rising), "{rising}");
}

#[test]
fn 矩形波は音量の正負の2値だけを取る() {
    let out = render(&[one(100.0, 0.0, 0.5, Wave::Square, 0.5)], RATE);
    let middle = &out[out.len() / 4..out.len() * 3 / 4];
    assert!(middle.iter().all(|s| (s.abs() - 0.5).abs() < 1e-6));
}

#[test]
fn 音の開始前は無音() {
    let out = render(&[one(440.0, 0.5, 0.2, Wave::Sine, 0.7)], RATE);
    let before = (0.5 * f64::from(RATE)) as usize;
    assert!(out[..before].iter().all(|s| *s == 0.0));
    assert!(peak(&out[before..]) > 0.5);
}

#[test]
fn 重なった音は足し合わされ_1を超えない() {
    let notes = [
        one(100.0, 0.0, 0.3, Wave::Square, 0.9),
        one(100.0, 0.0, 0.3, Wave::Square, 0.9),
    ];
    assert!(peak(&render(&notes, RATE)) <= 1.0);
}

#[test]
fn 三角波と鋸波は範囲内で動く() {
    for wave in [Wave::Triangle, Wave::Sawtooth] {
        let out = render(&[one(200.0, 0.0, 0.3, wave, 0.6)], RATE);
        assert!(peak(&out) <= 0.6 + 1e-6);
        assert!(peak(&out) > 0.5);
    }
}

#[test]
fn まもなく終了は同じ高さの3連ビープ() {
    let notes = warning_notes();
    assert_eq!(notes.len(), 3);
    assert!(notes.iter().all(|n| n.freq == 1396.91 && n.wave == Wave::Square));
    let starts: Vec<f64> = notes.iter().map(|n| n.at).collect();
    assert_eq!(starts, vec![0.0, 0.16, 0.32]);
}

#[test]
fn 目の休憩は上昇する3音のチャイム() {
    let notes = eye_break_notes();
    let freqs: Vec<f64> = notes.iter().map(|n| n.freq).collect();
    assert_eq!(freqs, vec![392.0, 523.25, 659.25]);
    assert!(notes.iter().all(|n| n.wave == Wave::Triangle));
}

#[test]
fn 不規則ビープは範囲内で_重ならず_指定の長さに収まる() {
    let mut seed = 0.123;
    let notes = irregular_beeps(10.0, move || {
        seed = (seed * 9301.0 + 0.49297f64).fract();
        seed
    });
    assert!(notes.len() > 10);
    let mut previous_end = 0.0;
    for n in &notes {
        assert!((620.0..=1480.0).contains(&n.freq));
        assert!((0.04..=0.38).contains(&n.dur));
        assert!(n.at >= previous_end, "重なっている");
        previous_end = n.at + n.dur;
    }
    assert!(previous_end <= 10.0 + 1e-9);
}

#[test]
fn 不規則ビープの1秒版は1秒に収まる() {
    let notes = irregular_beeps(EVOLVE_SECS, sequence(vec![0.5, 0.3, 0.7, 0.2]));
    assert!(!notes.is_empty());
    let end = notes.last().map(|n| n.at + n.dur).unwrap();
    assert!(end <= EVOLVE_SECS + 1e-9);
}

#[test]
fn 乱数が最小でも最大でも終わる() {
    assert!(!irregular_beeps(10.0, || 0.0).is_empty());
    assert!(!irregular_beeps(10.0, || 0.999_999).is_empty());
}

#[test]
fn 乱数の値が音色に対応する() {
    // 呼び出し順: 長さ、高さ、音色、間隔。音色の値 0.0 / 0.3 / 0.6 / 0.9 は四つの波形に当たる。
    let waves: Vec<Wave> = [0.0, 0.3, 0.6, 0.9]
        .into_iter()
        .map(|w| irregular_beeps(0.1, sequence(vec![0.5, 0.5, w, 0.5]))[0].wave)
        .collect();
    assert_eq!(
        waves,
        vec![Wave::Sine, Wave::Square, Wave::Triangle, Wave::Sawtooth]
    );
}
