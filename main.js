const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  session,
  screen,
  globalShortcut,
} = require('electron');
const path = require('path');
const { execFile } = require('child_process');

// アップデートチェック（v3 は名前付きエクスポート）
const { updateElectronApp } = require('update-electron-app');
updateElectronApp();

// Windows で通知の識別を安定させる
app.setAppUserModelId('com.kumamorun.app');

let mainWindow = null;
let miniWindow = null;
let tray = null;
let isQuitting = false;

// ミニモード（残り時間だけの小さい常時最前面ウィンドウ）
const MINI_WIDTH = 240;
const MINI_HEIGHT = 100;
// セッション中に動かした位置を覚えておき、開き直しても同じ場所に出す
let miniBounds = null;
// メインウィンドウから届いた最新の表示内容。ミニを開いた直後に流し込むため保持する。
let lastMiniText = { label: '', remaining: '-' };

// Windows の音声合成（SAPI）に WAV を作らせて base64 で返す。
// レンダラーの speechSynthesis を直接使うと音量の上限が 1.0 で頭打ちになるため、
// 音声データを受け取って Web Audio の GainNode を通す形にしている（renderer 側で増幅）。
// 読み上げる文字列は引数ではなく環境変数で渡す（引用符の取り違えを避けるため）。
const TTS_SCRIPT = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$ja = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'ja-JP' } | Select-Object -First 1
if ($ja) { $synth.SelectVoice($ja.VoiceInfo.Name) }
$synth.Rate = 1
$synth.Volume = 100
$stream = New-Object System.IO.MemoryStream
$synth.SetOutputToWaveStream($stream)
$synth.Speak($env:KUMAMORUN_TTS_TEXT)
$synth.Dispose()
[Console]::Out.Write([Convert]::ToBase64String($stream.ToArray()))
`;

const synthesizeSpeech = (text) =>
  new Promise((resolve) => {
    if (process.platform !== 'win32' || !text) {
      resolve(null);
      return;
    }
    // -EncodedCommand（UTF-16LE の base64）で渡すと、改行や記号のエスケープを気にせずに済む
    const encoded = Buffer.from(TTS_SCRIPT, 'utf16le').toString('base64');
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      {
        env: { ...process.env, KUMAMORUN_TTS_TEXT: text },
        maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
      },
      (err, stdout) => {
        if (err) {
          // 失敗しても落とさない。レンダラー側が speechSynthesis に切り替える。
          console.log('音声合成に失敗しました', err);
          resolve(null);
          return;
        }
        resolve(stdout.trim());
      },
    );
  });

// 残り時間の読み上げを呼び出すグローバルショートカット。
// 設定は renderer の localStorage にあるので、起動時と設定保存時に renderer から送ってもらう。
let speakShortcut = null;

// 読み上げショートカットを付け替える。accelerator が空なら無効にするだけ。
// 戻り値の ok が false なら、他のアプリがそのキーを既に押さえている。
const setSpeakShortcut = (accelerator) => {
  if (speakShortcut) {
    globalShortcut.unregister(speakShortcut);
    speakShortcut = null;
  }
  if (!accelerator) return { ok: true };
  try {
    const ok = globalShortcut.register(accelerator, () => {
      // 読み上げは Web Speech API を使うのでレンダラーにやってもらう。
      // ウィンドウが非表示（トレイ常駐・ミニモード）でも動く。
      if (mainWindow) mainWindow.webContents.send('speak-remaining');
    });
    if (ok) speakShortcut = accelerator;
    return { ok };
  } catch (e) {
    // accelerator の書式が不正だと register が例外を投げる
    console.log('ショートカットを登録できませんでした', accelerator, e);
    return { ok: false };
  }
};

// --hidden 付き（自動起動時）は画面を出さずにバックグラウンドで開始する
const startHidden = process.argv.includes('--hidden');

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: !startHidden,
    icon: path.join(__dirname, 'src', 'icon.ico'),
    webPreferences: {
      // 非表示・非アクティブでもタイマー/アラームの setInterval を間引かない
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  // ウィンドウを閉じてもアプリは終了せず、トレイに隠して裏で動かし続ける
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
};

// ミニモードのウィンドウ。枠なし・背景透過・常に最前面で、残り時間だけを出す。
const createMiniWindow = () => {
  if (miniWindow) {
    miniWindow.show();
    return;
  }

  // 既定位置は作業領域の右下（タスクバーを避ける）
  const { workArea } = screen.getPrimaryDisplay();
  const x = miniBounds ? miniBounds.x : workArea.x + workArea.width - MINI_WIDTH - 24;
  const y = miniBounds ? miniBounds.y : workArea.y + workArea.height - MINI_HEIGHT - 24;

  miniWindow = new BrowserWindow({
    width: MINI_WIDTH,
    height: MINI_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  miniWindow.loadFile('mini.html');

  // 読み込み完了時点の最新値を流し込む（開いた瞬間に "-" が出ないように）
  miniWindow.webContents.on('did-finish-load', () => {
    if (miniWindow) miniWindow.webContents.send('mini:text', lastMiniText);
  });

  miniWindow.on('move', () => {
    if (miniWindow) miniBounds = miniWindow.getBounds();
  });

  // 閉じたら（✕ でも Alt+F4 でも）必ずメインウィンドウへ戻す
  miniWindow.on('closed', () => {
    miniWindow = null;
    if (isQuitting || !mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('mini:closed');
  });
};

const createTray = () => {
  const iconPath = path.join(__dirname, 'src', 'kumamoru.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Kumamorun');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '表示',
      click: () => mainWindow && mainWindow.show(),
    },
    {
      label: 'PC起動時に自動で起動（バックグラウンド）',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked, args: ['--hidden'] });
      },
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  // トレイアイコンのダブルクリックで表示する
  tray.on('double-click', () => mainWindow && mainWindow.show());
};

// 多重起動を防ぎ、既存インスタンスを前面に出す
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // タイマー完了時、非表示（トレイ常駐）でもウィンドウを前面に出して確実に気づかせる。
  // 最前面を解除するタイマー（アラームが鳴り終わったら普通のウィンドウに戻す）
  let alwaysOnTopTimer = null;
  ipcMain.on('surface-window', (_e, holdSec) => {
    // ミニモード中の完走はミニを畳んでメインを出す（closed ハンドラが表示まで面倒を見る）
    if (miniWindow) miniWindow.close();
    if (!mainWindow) return;

    mainWindow.show();
    // 'screen-saver' は Electron の最上位レベルで、**他アプリが全画面でもその上**に出る。
    // focus() だけだと Windows のフォアグラウンド強奪制限に阻まれてタスクバーが点滅するだけに
    // 終わることがあるが、最前面指定はフォーカスを奪わずに前へ出せるのでその制限を受けない。
    // ※ 排他的全画面（DirectX が画面出力を占有するゲーム）だけは OS の仕様上どうしても重ねられない。
    //    その場合は音とタスクバーで気づいてもらう。
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.moveTop();
    mainWindow.focus();

    // アラームが鳴り終わったら最前面を解除する。ずっと最前面のままだと他の作業に居座るため、
    // 「鳴っている間だけ割り込む」挙動にしている。0.5秒は鳴り終わりとの前後差の余裕。
    clearTimeout(alwaysOnTopTimer);
    const hold = Number(holdSec) > 0 ? Number(holdSec) : 10;
    alwaysOnTopTimer = setTimeout(
      () => {
        alwaysOnTopTimer = null;
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(false);
      },
      hold * 1000 + 500,
    );
  });

  // アプリのバージョン（package.json の version）を画面表示用に返す
  ipcMain.handle('app:version', () => app.getVersion());

  // 集中モード: ウィンドウをOSフルスクリーンに切り替える
  ipcMain.on('set-fullscreen', (_e, on) => {
    if (mainWindow) mainWindow.setFullScreen(!!on);
  });

  // ミニモード: メインを隠して、残り時間だけの小さいウィンドウに切り替える
  ipcMain.on('mini:open', () => {
    createMiniWindow();
    if (mainWindow) mainWindow.hide();
  });

  ipcMain.on('mini:close', () => {
    if (miniWindow) miniWindow.close();
  });

  // 読み上げショートカットの登録・変更（renderer の設定が唯一の持ち主）
  ipcMain.handle('shortcut:speak', (_e, accelerator) => setSpeakShortcut(accelerator || ''));

  // 読み上げる文章を WAV（base64）にして返す。鳴らすのは renderer。
  ipcMain.handle('speak:wav', (_e, text) => synthesizeSpeech(String(text || '')));

  // メインウィンドウの #remaining / #label が変わるたびに届く表示内容を中継する
  ipcMain.on('mini:sync', (_e, payload) => {
    if (payload) lastMiniText = payload;
    if (miniWindow) miniWindow.webContents.send('mini:text', lastMiniText);
  });

  app.whenReady().then(() => {
    // 通知と、スピーカー一覧の名前取得（media）だけを許可する。それ以外は拒否。
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(permission === 'media' || permission === 'notifications');
    });

    // 既定のメニューバー（File / Edit / View …）は**配布版でだけ**外す。ウィンドウ生成前に呼ぶ。
    // 外すと Alt キーでも出てこない代わりに、Ctrl+Shift+I（DevTools）や Ctrl+R（再読み込み）
    // といった既定のアクセラレータも一緒に無効になる。開発中はそれらを使いたいので残す。
    // app.isPackaged は `bun run start` や electron.exe . では false、インストール版で true。
    if (app.isPackaged) Menu.setApplicationMenu(null);

    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else if (mainWindow) mainWindow.show();
    });
  });

  // 全ウィンドウが閉じても終了しない（トレイに常駐して動作を継続）
  app.on('window-all-closed', () => {
    // 何もしない
  });

  // 終了時にグローバルショートカットを OS へ返す
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
