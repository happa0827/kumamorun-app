use super::*;

#[test]
fn 動いていないときは動いていないと読む() {
    for phase in ["idle", "offline"] {
        assert_eq!(text_for(phase, "", None, None), "タイマーは動いていません");
    }
}

#[test]
fn 時間切れ() {
    assert_eq!(text_for("finished", "遊び", Some(0), None), "時間切れです");
}

#[test]
fn 打ち切られたときは理由を読む() {
    assert_eq!(
        text_for("ended", "遊び", None, Some("lunchStart")),
        "昼休憩の時間です"
    );
    assert_eq!(
        text_for("ended", "遊び", None, Some("endTime")),
        "終了の時間です"
    );
    assert_eq!(text_for("ended", "遊び", None, None), "時間切れです");
}

#[test]
fn 残り時間を分と秒で読む() {
    assert_eq!(text_for("play", "遊び", Some(90), None), "遊び、残り1分30秒です");
    assert_eq!(text_for("break", "休憩", Some(300), None), "休憩、残り5分です");
    assert_eq!(text_for("play", "遊び", Some(45), None), "遊び、残り45秒です");
    assert_eq!(text_for("play", "遊び", Some(0), None), "遊び、残り0秒です");
}

#[test]
fn 括弧つきのラベルは読点にして読む() {
    assert_eq!(
        text_for("play", "遊び（昼休憩まで）", Some(600), None),
        "遊び、昼休憩まで、残り10分です"
    );
}

#[test]
fn ラベルが無ければ残り時間だけ読む() {
    assert_eq!(text_for("reward", "", Some(125), None), "残り2分5秒です");
}

#[test]
fn 残り時間が不明なら0秒として読む() {
    assert_eq!(text_for("play", "遊び", None, None), "遊び、残り0秒です");
}

#[test]
fn 負の秒数は0秒として読む() {
    assert_eq!(text_for("play", "遊び", Some(-5), None), "遊び、残り0秒です");
}

/// 試験用の WAV を組み立てる。
fn wav(channels: u16, rate: u32, samples: &[i16], extra_chunk: bool) -> Vec<u8> {
    let data: Vec<u8> = samples.iter().flat_map(|s| s.to_le_bytes()).collect();
    let mut body = Vec::new();
    body.extend(b"WAVE");
    body.extend(b"fmt ");
    body.extend(16u32.to_le_bytes());
    body.extend(1u16.to_le_bytes());
    body.extend(channels.to_le_bytes());
    body.extend(rate.to_le_bytes());
    body.extend((rate * u32::from(channels) * 2).to_le_bytes());
    body.extend((channels * 2).to_le_bytes());
    body.extend(16u16.to_le_bytes());
    if extra_chunk {
        // 奇数サイズのチャンクは1バイトの詰め物が入る。
        body.extend(b"junk");
        body.extend(3u32.to_le_bytes());
        body.extend([1, 2, 3, 0]);
    }
    body.extend(b"data");
    body.extend((data.len() as u32).to_le_bytes());
    body.extend(data);
    let mut out = Vec::new();
    out.extend(b"RIFF");
    out.extend((body.len() as u32).to_le_bytes());
    out.extend(body);
    out
}

#[test]
fn wavを読んで_サンプルを1から_1に直す() {
    let pcm = decode_wav(&wav(1, 22_050, &[0, 16384, -32768, 32767], false)).unwrap();
    assert_eq!((pcm.channels, pcm.rate), (1, 22_050));
    assert_eq!(pcm.samples.len(), 4);
    assert_eq!(pcm.samples[0], 0.0);
    assert!((pcm.samples[1] - 0.5).abs() < 1e-6);
    assert_eq!(pcm.samples[2], -1.0);
    assert!(pcm.samples[3] < 1.0 && pcm.samples[3] > 0.999);
}

#[test]
fn 間に別のチャンクがあっても_dataを見つける() {
    let pcm = decode_wav(&wav(2, 44_100, &[100, -100], true)).unwrap();
    assert_eq!(pcm.channels, 2);
    assert_eq!(pcm.samples.len(), 2);
}

#[test]
fn サイズが実際より大きく書かれていても_読める分だけ読む() {
    let mut bytes = wav(1, 22_050, &[1, 2, 3, 4], false);
    bytes.truncate(bytes.len() - 2);
    let pcm = decode_wav(&bytes).unwrap();
    assert_eq!(pcm.samples.len(), 3);
}

#[test]
fn wavでないものや未対応の形式はエラー() {
    assert!(decode_wav(b"").is_err());
    assert!(decode_wav(b"RIFFxxxxAVI ").is_err());
    let mut float = wav(1, 22_050, &[1], false);
    float[20] = 3; // 形式 3 = 浮動小数点
    assert!(decode_wav(&float).is_err());
    let mut no_data = wav(1, 22_050, &[1], false);
    no_data.truncate(36);
    assert!(decode_wav(&no_data).is_err());
}

fn pcm(samples: Vec<f32>) -> Pcm {
    Pcm {
        channels: 1,
        rate: 22_050,
        samples,
    }
}

#[test]
fn 小さい音はそのまま増幅される() {
    let mut p = pcm(vec![0.1; 2000]);
    amplify(&mut p, 4.0);
    assert!(p.samples.iter().all(|s| (s - 0.4).abs() < 1e-4));
}

#[test]
fn 大きい音は振り切れず_1以内に収まり_潰される() {
    let mut p = pcm(
        (0..22_050)
            .map(|i| (i as f32 * 440.0 * std::f32::consts::TAU / 22_050.0).sin() * 0.9)
            .collect(),
    );
    amplify(&mut p, 4.0);
    let peak = p.samples.iter().fold(0.0f32, |m, s| m.max(s.abs()));
    assert!(peak <= 1.0);
    // 単にクリップしただけなら終盤も 1.0 に張り付く。潰されていれば下がる。
    let late_peak = p.samples[11_000..]
        .iter()
        .fold(0.0f32, |m, s| m.max(s.abs()));
    assert!(late_peak < 0.95, "{late_peak}");
}

#[test]
fn 無音は無音のまま() {
    let mut p = pcm(vec![0.0; 100]);
    amplify(&mut p, 4.0);
    assert!(p.samples.iter().all(|s| *s == 0.0));
}

#[test]
fn 音量から増幅率を決める() {
    assert_eq!(gain_for(0), None);
    assert_eq!(gain_for(100), Some(4.0));
    assert_eq!(gain_for(50), Some(2.0));
    // 範囲外は100%として扱う。
    assert_eq!(gain_for(250), Some(4.0));
}
