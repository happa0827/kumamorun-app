const { contextBridge, ipcRenderer } = require('electron');

// レンダラーから main プロセスへ最小限の操作だけを公開する。
// タイマー完了時にウィンドウを前面へ出して、非表示（トレイ常駐）中でも
// アラームに気づけるようにするためのもの。完了後は常時最前面のままにする。
contextBridge.exposeInMainWorld('kumamorunAPI', {
  // mode: 'keep'＝遊び／休憩の時間切れ（次のタイマーまで閉じられない）
  //       'alarm'＝昼休憩／終了のアラーム（鳴り終わりで release してよい）
  surfaceWindow: (mode) => ipcRenderer.send('surface-window', mode || 'alarm'),
  releaseAlwaysOnTop: (force) => ipcRenderer.send('release-always-on-top', !!force),
  getVersion: () => ipcRenderer.invoke('app:version'),
  isDev: process.argv.includes('--kumamorun-dev'),
  setFullscreen: (on) => ipcRenderer.send('set-fullscreen', !!on),

  // ミニモード（残り時間だけの小さいウィンドウ）
  // 送る側＝メインウィンドウ、受け取る側＝mini.html。どちらもこの preload を使う。
  openMini: () => ipcRenderer.send('mini:open'),
  closeMini: () => ipcRenderer.send('mini:close'),
  syncMini: (payload) => ipcRenderer.send('mini:sync', payload),
  onMiniText: (cb) => ipcRenderer.on('mini:text', (_e, payload) => cb(payload || {})),
  onMiniClosed: (cb) => ipcRenderer.on('mini:closed', () => cb()),

  // 残り時間の読み上げ。キーの登録は main（グローバルショートカット）、
  // 読み上げそのものは Web Speech API が使えるレンダラー側で行う。
  registerSpeakShortcut: (accelerator) => ipcRenderer.invoke('shortcut:speak', accelerator),
  speakWav: (text) => ipcRenderer.invoke('speak:wav', text),
  onSpeakRemaining: (cb) => ipcRenderer.on('speak-remaining', () => cb()),
});
