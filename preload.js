const { contextBridge, ipcRenderer } = require('electron');

// レンダラーから main プロセスへ最小限の操作だけを公開する。
// タイマー完了時にウィンドウを前面へ出して、非表示（トレイ常駐）中でも
// アラームに気づけるようにするためのもの。
contextBridge.exposeInMainWorld('kumamorunAPI', {
  surfaceWindow: () => ipcRenderer.send('surface-window'),
  setFullscreen: (on) => ipcRenderer.send('set-fullscreen', !!on),
});
