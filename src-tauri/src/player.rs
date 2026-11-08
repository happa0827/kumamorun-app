//! ドメインの `Sound` を、設定された出力先で鳴らす。鳴らす間は別スレッドで、tick を止めない。

use std::hash::{BuildHasher, Hasher};
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};

use crate::app::{self, AppState};
use crate::audio_out;
use crate::domain::effects::Sound;
use crate::domain::timer::TimerKind;
use crate::settings::Use;
use crate::sound::{
    ALARM_SECS, EVOLVE_SECS, Note, eye_break_notes, irregular_beeps, render, warning_notes,
};
use crate::speech::{amplify, gain_for};
use crate::tts;

const RATE: u32 = 44_100;

/// 0以上1未満の乱数。暗号用ではなく、音をばらけさせるだけ。
fn unit_random() -> impl FnMut() -> f64 {
    let mut state = std::collections::hash_map::RandomState::new()
        .build_hasher()
        .finish()
        | 1;
    move || {
        // xorshift64
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        (state >> 11) as f64 / (1u64 << 53) as f64
    }
}

fn notes_for(sound: Sound) -> (Vec<Note>, Use) {
    match sound {
        Sound::Finish(TimerKind::Play) => (irregular_beeps(ALARM_SECS, unit_random()), Use::Play),
        Sound::Finish(TimerKind::Break) => (irregular_beeps(ALARM_SECS, unit_random()), Use::Break),
        Sound::Alarm => (irregular_beeps(ALARM_SECS, unit_random()), Use::Shared),
        Sound::Warning => (warning_notes(), Use::Notify),
        Sound::EyeBreak => (eye_break_notes(), Use::Notify),
        Sound::Evolved => (irregular_beeps(EVOLVE_SECS, unit_random()), Use::Shared),
    }
}

pub fn play(app: &AppHandle, sound: Sound) {
    let app = app.clone();
    thread::spawn(move || {
        let (notes, use_) = notes_for(sound);
        let device = app.state::<AppState>().speaker(use_);
        let started = Instant::now();
        if let Err(e) = audio_out::play(render(&notes, RATE), 1, RATE, &device, &|| false) {
            eprintln!("音を鳴らせませんでした: {e}");
        }
        if sound == Sound::Alarm {
            // 鳴らせなかったときも、アラームの長さの間は前面に出しておく。
            let total = Duration::from_secs_f64(ALARM_SECS);
            if let Some(rest) = total.checked_sub(started.elapsed()) {
                thread::sleep(rest);
            }
            app::finish_alarm(&app);
        }
    });
}

/// 設定画面の「テスト再生」。選択中の出力先で、その用途の音を短く鳴らす。
pub fn test(use_: Use, device: &str) -> Result<(), String> {
    let notes = match use_ {
        Use::Notify => warning_notes(),
        _ => irregular_beeps(EVOLVE_SECS, unit_random()),
    };
    audio_out::play(render(&notes, RATE), 1, RATE, device, &|| false)
}

/// いま読み上げている番号。新しい読み上げが始まると進み、前の読み上げはそれを見て止まる。
static SPEECH: AtomicU64 = AtomicU64::new(0);

/// 文を読み上げる。`volume` は 0〜100%（0 なら読まない）。前の読み上げは止める。
pub fn speak(app: &AppHandle, text: String, volume: u8) {
    let Some(gain) = gain_for(volume) else {
        return;
    };
    let id = SPEECH.fetch_add(1, Ordering::SeqCst) + 1;
    let app = app.clone();
    thread::spawn(move || {
        let mut pcm = match tts::synthesize(&text) {
            Ok(pcm) => pcm,
            Err(e) => {
                eprintln!("{e}");
                return;
            }
        };
        // 合成の間に次の読み上げが始まっていたら、こちらは鳴らさない。
        if SPEECH.load(Ordering::SeqCst) != id {
            return;
        }
        amplify(&mut pcm, gain);
        let device = app.state::<AppState>().speaker(Use::Shared);
        let stopped = || SPEECH.load(Ordering::SeqCst) != id;
        if let Err(e) = audio_out::play(pcm.samples, pcm.channels, pcm.rate, &device, &stopped) {
            eprintln!("読み上げを鳴らせませんでした: {e}");
        }
    });
}

/// 画面に出ている残り時間を読み上げる。`volume` が無ければ設定の音量。
pub fn speak_remaining(app: &AppHandle, volume: Option<u8>) {
    let state = app.state::<AppState>();
    let volume = volume.unwrap_or_else(|| state.speak_volume());
    speak(app, state.speech_text(), volume);
}
