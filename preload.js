const { contextBridge, ipcRenderer } = require('electron');

// レンダラーから main プロセスへ最小限の操作だけを公開する。
// タイマー完了時にウィンドウを前面へ出して、非表示（トレイ常駐）中でも
// アラームに気づけるようにするためのもの。
contextBridge.exposeInMainWorld('kumamorunAPI', {
  surfaceWindow: () => ipcRenderer.send('surface-window'),
  getVersion: () => ipcRenderer.invoke('app:version'),
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
  onSpeakRemaining: (cb) => ipcRenderer.on('speak-remaining', () => cb()),
});
