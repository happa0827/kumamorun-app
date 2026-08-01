const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, session, screen } = require('electron');
const path = require('path');

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

  // タイマー完了時、非表示（トレイ常駐）でもウィンドウを前面に出して確実に気づかせる
  ipcMain.on('surface-window', () => {
    // ミニモード中の完走はミニを畳んでメインを出す（closed ハンドラが表示まで面倒を見る）
    if (miniWindow) miniWindow.close();
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

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

    // 既定のメニューバー（File / Edit / View …）を丸ごと外す。ウィンドウ生成前に呼ぶ。
    // Alt キーでも出てこない代わりに、Ctrl+Shift+I などの既定ショートカットも無効になる。
    Menu.setApplicationMenu(null);

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
}
