// ミニモード専用スクリプト。bundle.js（renderer.js）は読み込まない。
// タイマーの計算や判定は一切持たず、メインウィンドウから中継されてくる
// 残り時間の文字列をそのまま描画するだけ。表示ロジックはメイン側の一本のまま。
const labelEl = document.getElementById('mini-label');
const remainingEl = document.getElementById('mini-remaining');
const exitBtn = document.getElementById('mini-exit');

if (window.kumamorunAPI) {
  window.kumamorunAPI.onMiniText((payload) => {
    labelEl.textContent = payload.label || '';
    remainingEl.textContent = payload.remaining || '-';
  });

  // 閉じるとメインウィンドウが戻ってくる（復帰処理は main.js の closed ハンドラ）
  exitBtn.addEventListener('click', () => window.kumamorunAPI.closeMini());
}
