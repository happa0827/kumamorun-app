const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, session } = require('electron');
const path = require('path');

// アップデートチェック（v3 は名前付きエクスポート）
const { updateElectronApp } = require('update-electron-app');
updateElectronApp();

// Windows で通知の識別を安定させる
app.setAppUserModelId('com.kumamorun.app');

let mainWindow = null;
let tray = null;
let isQuitting = false;

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
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // 集中モード: ウィンドウをOSフルスクリーンに切り替える
  ipcMain.on('set-fullscreen', (_e, on) => {
    if (mainWindow) mainWindow.setFullScreen(!!on);
  });

  app.whenReady().then(() => {
    // 通知と、スピーカー一覧の名前取得（media）だけを許可する。それ以外は拒否。
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(permission === 'media' || permission === 'notifications');
    });

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
