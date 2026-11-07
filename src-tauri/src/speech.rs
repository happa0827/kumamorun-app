//! 残り時間の読み上げ。読む文の組み立てと、音声合成が作った WAV の増幅だけを持つ。
//! 合成そのもの（PowerShell）は `tts`、鳴らすのは `audio_out`。

/// 音量 100% のときの増幅率。合成の音量は 1.0 が上限で小さいため、後から増幅する。
pub const MAX_GAIN: f32 = 4.0;

const SEPARATOR_OPEN: char = '（';
const SEPARATOR_CLOSE: char = '）';

fn time_words(total_secs: i64) -> String {
    let total_secs = total_secs.max(0);
    let (minutes, seconds) = (total_secs / 60, total_secs % 60);
    let mut words = String::new();
    if minutes > 0 {
        words.push_str(&format!("{minutes}分"));
    }
    if seconds > 0 {
        words.push_str(&format!("{seconds}秒"));
    }
    if words.is_empty() {
        words.push_str("0秒");
    }
    words
}

/// 画面に出ている内容を、そのまま読める日本語にする。
/// `phase` は liveStatus の段階名、`ended_by` は打ち切りの理由（`lunchStart` / `endTime`）。
pub fn text_for(
    phase: &str,
    label: &str,
    remaining_secs: Option<i64>,
    ended_by: Option<&str>,
) -> String {
    match phase {
        "idle" | "offline" => "タイマーは動いていません".into(),
        "finished" => "時間切れです".into(),
        "ended" => match ended_by {
            Some("lunchStart") => "昼休憩の時間です".into(),
            Some("endTime") => "終了の時間です".into(),
            _ => "時間切れです".into(),
        },
        _ => {
            let time = time_words(remaining_secs.unwrap_or(0));
            // 「遊び（昼休憩まで）」の括弧は、読点にした方が自然に読まれる。
            let name = label
                .replace(SEPARATOR_OPEN, "、")
                .replace(SEPARATOR_CLOSE, "");
            if name.is_empty() {
                format!("残り{time}です")
            } else {
                format!("{name}、残り{time}です")
            }
        }
    }
}

/// 音声合成が作った WAV（16bit PCM）の中身。サンプルは -1〜1 で、チャンネルは交互に並ぶ。
#[derive(Debug, Clone, PartialEq)]
pub struct Pcm {
    pub channels: u16,
    pub rate: u32,
    pub samples: Vec<f32>,
}

fn le_u16(bytes: &[u8], at: usize) -> Option<u16> {
    Some(u16::from_le_bytes(bytes.get(at..at + 2)?.try_into().ok()?))
}

fn le_u32(bytes: &[u8], at: usize) -> Option<u32> {
    Some(u32::from_le_bytes(bytes.get(at..at + 4)?.try_into().ok()?))
}

pub fn decode_wav(bytes: &[u8]) -> Result<Pcm, String> {
    if bytes.get(0..4) != Some(b"RIFF") || bytes.get(8..12) != Some(b"WAVE") {
        return Err("WAV ではありません".into());
    }
    let mut format: Option<(u16, u16, u32, u16)> = None;
    let mut at = 12;
    while let (Some(id), Some(size)) = (bytes.get(at..at + 4), le_u32(bytes, at + 4)) {
        let body = at + 8;
        let size = size as usize;
        if id == b"fmt " {
            format = Some((
                le_u16(bytes, body).ok_or("fmt が短すぎます")?,
                le_u16(bytes, body + 2).ok_or("fmt が短すぎます")?,
                le_u32(bytes, body + 4).ok_or("fmt が短すぎます")?,
                le_u16(bytes, body + 14).ok_or("fmt が短すぎます")?,
            ));
        } else if id == b"data" {
            let (tag, channels, rate, bits) = format.ok_or("data の前に fmt がありません")?;
            if tag != 1 || bits != 16 || channels == 0 {
                return Err(format!("未対応の形式です（形式 {tag}、{bits}bit、{channels}ch）"));
            }
            // 書き込み中のファイルのように、サイズが実際より大きい場合は読める分だけ読む。
            let end = (body + size).min(bytes.len());
            let samples = bytes[body..end]
                .chunks_exact(2)
                .map(|pair| f32::from(i16::from_le_bytes([pair[0], pair[1]])) / 32768.0)
                .collect();
            return Ok(Pcm {
                channels,
                rate,
                samples,
            });
        }
        // チャンクは偶数バイトに揃えて並ぶ。
        at = body + size + (size & 1);
    }
    Err("音声データが見つかりません".into())
}

const THRESHOLD: f32 = 0.707_9; // -3 dB
const RATIO: f32 = 20.0;
const ATTACK_SECS: f32 = 0.003;
const RELEASE_SECS: f32 = 0.1;

/// `gain` 倍に増幅し、振り切れた分を潰して割れた音にならないようにする。
pub fn amplify(pcm: &mut Pcm, gain: f32) {
    let rate = pcm.rate as f32;
    let attack = (-1.0 / (ATTACK_SECS * rate)).exp();
    let release = (-1.0 / (RELEASE_SECS * rate)).exp();
    let mut envelope = 0.0f32;
    for sample in &mut pcm.samples {
        let boosted = *sample * gain;
        let level = boosted.abs();
        let coefficient = if level > envelope { attack } else { release };
        envelope = coefficient * envelope + (1.0 - coefficient) * level;
        let reduction = if envelope > THRESHOLD {
            (THRESHOLD + (envelope - THRESHOLD) / RATIO) / envelope
        } else {
            1.0
        };
        *sample = (boosted * reduction).clamp(-1.0, 1.0);
    }
}

/// 音量（0〜100%）に応じた増幅率。0 なら読み上げない。
pub fn gain_for(volume_percent: u8) -> Option<f32> {
    let volume = volume_percent.min(100);
    (volume > 0).then(|| f32::from(volume) / 100.0 * MAX_GAIN)
}

#[cfg(test)]
mod tests;
