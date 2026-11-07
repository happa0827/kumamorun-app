//! Windows の音声合成（System.Speech）で、文を WAV にする。OS に触れる層。
//!
//! 読む文は引数ではなく環境変数で渡す（引用符や記号の取り違えを避けるため）。
//! スクリプトは -EncodedCommand（UTF-16LE の base64）で渡す。

use std::os::windows::process::CommandExt;
use std::process::Command;

use crate::speech::{Pcm, decode_wav};

/// コンソール窓を出さない。
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

const SCRIPT: &str = r#"
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$ja = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'ja-JP' } | Select-Object -First 1
if ($ja) { $synth.SelectVoice($ja.VoiceInfo.Name) }
$synth.Rate = 1
$synth.Volume = 100
$synth.SetOutputToWaveFile($env:KUMAMORUN_TTS_PATH)
$synth.Speak($env:KUMAMORUN_TTS_TEXT)
$synth.Dispose()
"#;

/// PowerShell に渡す形（UTF-16LE の base64）にする。
fn encode_script(script: &str) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let bytes: Vec<u8> = script.encode_utf16().flat_map(u16::to_le_bytes).collect();
    let mut out = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let n = (u32::from(chunk[0]) << 16)
            | (u32::from(*chunk.get(1).unwrap_or(&0)) << 8)
            | u32::from(*chunk.get(2).unwrap_or(&0));
        for i in 0..4 {
            if i <= chunk.len() {
                out.push(TABLE[((n >> (18 - 6 * i)) & 63) as usize] as char);
            } else {
                out.push('=');
            }
        }
    }
    out
}

/// 数百ミリ秒かかる。呼び出し側で別スレッドにすること。
pub fn synthesize(text: &str) -> Result<Pcm, String> {
    let dir = tempfile_dir()?;
    let path = dir.join(format!("kumamorun-tts-{}.wav", std::process::id()));
    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-EncodedCommand"])
        .arg(encode_script(SCRIPT))
        .env("KUMAMORUN_TTS_TEXT", text)
        .env("KUMAMORUN_TTS_PATH", &path)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("PowerShell を起動できません: {e}"))?;
    let bytes = std::fs::read(&path);
    let _ = std::fs::remove_file(&path);
    if !output.status.success() {
        return Err(format!(
            "音声合成に失敗しました: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    decode_wav(&bytes.map_err(|e| format!("音声ファイルを読めません: {e}"))?)
}

fn tempfile_dir() -> Result<std::path::PathBuf, String> {
    let dir = std::env::temp_dir();
    dir.is_dir()
        .then_some(dir)
        .ok_or_else(|| "一時フォルダーがありません".into())
}

#[cfg(test)]
mod tests {
    use super::encode_script;

    #[test]
    fn スクリプトはutf16leのbase64で渡す() {
        // "A" は UTF-16LE で 41 00。
        assert_eq!(encode_script("A"), "QQA=");
        assert_eq!(encode_script("AB"), "QQBCAA==");
        assert_eq!(encode_script("ABC"), "QQBCAEMA");
    }

    #[test]
    fn 日本語も正しく符号化する() {
        // "あ" = U+3042 → 42 30。
        assert_eq!(encode_script("あ"), "QjA=");
    }
}
