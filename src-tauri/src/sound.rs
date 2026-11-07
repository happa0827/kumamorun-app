//! 通知音の合成。音声ファイルは持たず、サンプルを計算して作る。
//! ここは計算だけで、鳴らすのは `audio_out`。

/// 完走・制限時刻の通過を知らせるアラームの長さ（秒）。
pub const ALARM_SECS: f64 = 10.0;
/// 進化・開花の音の長さ（秒）。
pub const EVOLVE_SECS: f64 = 1.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Wave {
    Sine,
    Square,
    Triangle,
    Sawtooth,
}

const WAVES: [Wave; 4] = [Wave::Sine, Wave::Square, Wave::Triangle, Wave::Sawtooth];

/// 1音。`at` と `dur` は秒。`volume` は 0〜1。
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Note {
    pub freq: f64,
    pub at: f64,
    pub dur: f64,
    pub wave: Wave,
    pub volume: f64,
}

fn note(freq: f64, at: f64, dur: f64, wave: Wave, volume: f64) -> Note {
    Note {
        freq,
        at,
        dur,
        wave,
        volume,
    }
}

/// 「まもなく終了」。同じ高さの短い3連ビープ。
pub fn warning_notes() -> Vec<Note> {
    [0.0, 0.16, 0.32]
        .into_iter()
        .map(|at| note(1396.91, at, 0.09, Wave::Square, 0.55))
        .collect()
}

/// 20-20-20ルール。「目を上げて」の合図の、上昇する3音チャイム。
pub fn eye_break_notes() -> Vec<Note> {
    vec![
        note(392.0, 0.0, 0.22, Wave::Triangle, 0.7),
        note(523.25, 0.26, 0.22, Wave::Triangle, 0.7),
        note(659.25, 0.52, 0.55, Wave::Triangle, 0.7),
    ]
}

/// 完走・制限時刻。高さ・長さ・間隔・音色を毎回変えて、耳が慣れにくくした不規則ビープ。
/// `random` は 0以上1未満の値を返す。
pub fn irregular_beeps(duration: f64, mut random: impl FnMut() -> f64) -> Vec<Note> {
    let mut between = |min: f64, max: f64| min + random() * (max - min);
    let mut notes = Vec::new();
    let mut at = 0.0;
    while at < duration {
        let dur = between(0.07, 0.38).min(duration - at);
        if dur < 0.04 {
            break;
        }
        let freq = between(620.0, 1480.0);
        let wave = WAVES[(between(0.0, 4.0) as usize).min(WAVES.len() - 1)];
        notes.push(note(freq, at, dur, wave, 0.75));
        at += dur + between(0.04, 0.42);
    }
    notes
}

fn sample(wave: Wave, phase: f64) -> f64 {
    let cycle = phase.fract();
    match wave {
        Wave::Sine => (cycle * std::f64::consts::TAU).sin(),
        Wave::Square => {
            if cycle < 0.5 {
                1.0
            } else {
                -1.0
            }
        }
        Wave::Triangle => 4.0 * (cycle - 0.5).abs() - 1.0,
        Wave::Sawtooth => 2.0 * cycle - 1.0,
    }
}

/// 音を重ねて、モノラルのサンプルにする。出だしと終わりをわずかにフェードして、
/// 「プツッ」というノイズを防ぐ。
pub fn render(notes: &[Note], rate: u32) -> Vec<f32> {
    let rate_f = f64::from(rate);
    let end = notes.iter().map(|n| n.at + n.dur).fold(0.0, f64::max);
    let mut out = vec![0.0f32; (end * rate_f).ceil() as usize];
    for n in notes {
        let fade = (n.dur / 4.0).min(0.01);
        let start = (n.at * rate_f).round() as usize;
        let count = (n.dur * rate_f).round() as usize;
        for i in 0..count {
            let Some(slot) = out.get_mut(start + i) else {
                break;
            };
            let t = i as f64 / rate_f;
            let envelope = (t / fade).min((n.dur - t) / fade).clamp(0.0, 1.0);
            let value = sample(n.wave, n.freq * t) * n.volume * envelope;
            *slot = (f64::from(*slot) + value).clamp(-1.0, 1.0) as f32;
        }
    }
    out
}

#[cfg(test)]
mod tests;
