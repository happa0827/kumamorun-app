//! 音の出力先（OS のスピーカー）への再生。Windows の音声 API に触れるのはここだけ。
//! 何を鳴らすかは `sound` と `speech`、いつ鳴らすかは `player` が決める。

use std::num::NonZero;
use std::thread;
use std::time::{Duration, Instant};

use rodio::buffer::SamplesBuffer;
use rodio::cpal::traits::{DeviceTrait, HostTrait};
use rodio::{Device, DeviceSinkBuilder, cpal};

/// 再生が終わるのを待つときの余裕。
const TAIL: Duration = Duration::from_millis(200);
/// 止める指示を確かめる間隔。
const POLL: Duration = Duration::from_millis(40);

fn outputs() -> Result<Vec<(String, Device)>, String> {
    let devices = cpal::default_host()
        .output_devices()
        .map_err(|e| e.to_string())?;
    Ok(devices
        .filter_map(|device| {
            let name = device.description().ok()?.name().to_string();
            Some((name, device))
        })
        .collect())
}

pub fn list_outputs() -> Result<Vec<String>, String> {
    Ok(outputs()?.into_iter().map(|(name, _)| name).collect())
}

/// サンプル（チャンネルは交互）を、名前で指定した出力先で鳴らし、鳴り終わるまで待つ。
/// 空文字や、見つからない名前なら、既定のスピーカーで鳴らす。
/// `cancelled` が true を返したら、その場で止める。
pub fn play(
    samples: Vec<f32>,
    channels: u16,
    rate: u32,
    device: &str,
    cancelled: &dyn Fn() -> bool,
) -> Result<(), String> {
    if samples.is_empty() {
        return Ok(());
    }
    let frames = samples.len() as f64 / f64::from(channels.max(1));
    let length = Duration::from_secs_f64(frames / f64::from(rate));
    let named = if device.is_empty() {
        None
    } else {
        outputs()?
            .into_iter()
            .find(|(name, _)| name == device)
            .map(|(_, device)| device)
    };
    let sink = match named {
        Some(device) => DeviceSinkBuilder::from_device(device)
            .map_err(|e| e.to_string())?
            .open_sink_or_fallback()
            .map_err(|e| e.to_string())?,
        None => DeviceSinkBuilder::open_default_sink().map_err(|e| e.to_string())?,
    };
    let channels = NonZero::new(channels).ok_or("チャンネル数が0です")?;
    let rate = NonZero::new(rate).ok_or("サンプルレートが0です")?;
    sink.mixer()
        .add(SamplesBuffer::new(channels, rate, samples));
    let started = Instant::now();
    while started.elapsed() < length + TAIL && !cancelled() {
        thread::sleep(POLL);
    }
    // sink を手放すと、鳴っている途中でも止まる。
    Ok(())
}
