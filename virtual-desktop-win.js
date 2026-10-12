// Windows の仮想デスクトップ追従。
// 表示中のウィンドウを、ユーザーが今いる仮想デスクトップへ連れてくる。
// 「全デスクトップに固定」はしない（今いる画面へ引っ張るだけ）。
//
// COM（IVirtualDesktopManager）は koffi で main プロセスから直接呼ぶ。PowerShell や
// rundll32 のような別プロセス経由では、そのプロセスから見たデスクトップしか分からない。
//
// Windows には「今のデスクトップの ID」を返す公開 API が無いので、こう回り込む。
//   1. 前景ウィンドウが今のデスクトップに居ることを確かめ、その ID を借りる（主経路）。
//   2. 借りられないとき（デスクトップに何も出ていない等）だけ、捨てるための 1x1 の
//      探査窓を作る。新しい窓は必ず今のデスクトップに生まれるので ID が分かる。
//
// 実測で分かった Windows 側の癖。探査窓の作りはこれに合わせている。
//   - 非表示の窓は追跡対象外。GetWindowDesktopId が TYPE_E_ELEMENTNOTFOUND を返す。
//   - focusable:false（WS_EX_NOACTIVATE）も追跡対象外になる。
//   - skipTaskbar:true（ITaskbarList::DeleteTab）は ID が空になる。移動自体は通る。
//   - 表示した直後はまだ ID が無い。メッセージが一巡するまで待つ必要がある。

const { app, BrowserWindow } = require('electron');

const FOLLOW_INTERVAL_MS = 500;
// 移動に失敗し続けるときの上限。0.5 秒ごとに探査窓を作り直さないための保険。
const MAX_INTERVAL_MS = 30000;
// 探査窓を出してから ID が付くまでの待ち。Windows がメッセージを一巡させる時間。
const PROBE_SETTLE_MS = 80;

const CLSID_VIRTUAL_DESKTOP_MANAGER = 'AA509086-5CA9-4C25-8F95-589D3C07B48A';
const IID_IVIRTUAL_DESKTOP_MANAGER = 'A5CD92FF-29BE-454C-8D04-D82879FB3F1B';

// IVirtualDesktopManager の vtable 番号（0〜2 は IUnknown の分）
const SLOT_IS_WINDOW_ON_CURRENT_VIRTUAL_DESKTOP = 3;
const SLOT_GET_WINDOW_DESKTOP_ID = 4;
const SLOT_MOVE_WINDOW_TO_DESKTOP = 5;

const S_OK = 0;
const S_FALSE = 1;
const RPC_E_CHANGED_MODE = 0x80010106 | 0;
const COINIT_APARTMENTTHREADED = 0x2;
const CLSCTX_INPROC_SERVER = 0x1;

// 探査窓。1x1 で画面外に置き、すぐ捨てる。
// skipTaskbar と focusable:false は付けない（付けると ID が取れなくなる）。
const PROBE_WINDOW_OPTIONS = {
  width: 1,
  height: 1,
  x: -4000,
  y: -4000,
  show: false,
  frame: false,
  transparent: true,
  hasShadow: false,
  resizable: false,
  minimizable: false,
  maximizable: false,
  fullscreenable: false,
};

const hresultText = (hresult) => `0x${(hresult >>> 0).toString(16).padStart(8, '0')}`;

// "AA509086-5CA9-..." を GUID 構造体にする（Data1〜3 は数値、Data4 はバイト列）
const guidFromText = (text) => {
  const bytes = Buffer.from(text.replace(/[{}-]/g, ''), 'hex');
  return {
    Data1: bytes.readUInt32BE(0),
    Data2: bytes.readUInt16BE(4),
    Data3: bytes.readUInt16BE(6),
    Data4: Array.from(bytes.subarray(8)),
  };
};

const nativeHandleOf = (win) => {
  const handle = win.getNativeWindowHandle();
  if (!handle || handle.length < 4) return null;
  return handle.length >= 8 ? handle.readBigInt64LE(0) : BigInt(handle.readInt32LE(0));
};

// IVirtualDesktopManager を掴む。使えなければ例外を投げる（呼び出し側が追従をやめる）。
const createDesktopManager = () => {
  const koffi = require('koffi');

  const GUID = koffi.struct('KumamorunGuid', {
    Data1: 'uint32',
    Data2: 'uint16',
    Data3: 'uint16',
    Data4: koffi.array('uint8', 8),
  });
  const guidPtr = koffi.pointer(GUID);
  const voidPtr = koffi.pointer('void');

  const ole32 = koffi.load('ole32.dll');
  const CoInitializeEx = ole32.func('__stdcall', 'CoInitializeEx', 'int32', ['void *', 'uint32']);
  const CoCreateInstance = ole32.func('__stdcall', 'CoCreateInstance', 'int32', [
    guidPtr,
    'void *',
    'uint32',
    guidPtr,
    koffi.out(koffi.pointer(voidPtr)),
  ]);
  const user32 = koffi.load('user32.dll');
  const GetForegroundWindow = user32.func('__stdcall', 'GetForegroundWindow', 'intptr_t', []);

  // Chromium が main スレッドの COM を初期化済みなので、S_FALSE（初期化の重ね掛け）と
  // RPC_E_CHANGED_MODE（別モードで初期化済み）はどちらも「使える」状態。
  // CoUninitialize は Chromium 側の COM を壊すので絶対に呼ばない。
  const initialized = CoInitializeEx(null, COINIT_APARTMENTTHREADED);
  if (initialized !== S_OK && initialized !== S_FALSE && initialized !== RPC_E_CHANGED_MODE) {
    throw new Error(`CoInitializeEx が ${hresultText(initialized)} を返しました`);
  }

  const created = [null];
  const hr = CoCreateInstance(
    guidFromText(CLSID_VIRTUAL_DESKTOP_MANAGER),
    null,
    CLSCTX_INPROC_SERVER,
    guidFromText(IID_IVIRTUAL_DESKTOP_MANAGER),
    created,
  );
  if (hr !== S_OK || !created[0]) {
    throw new Error(`CoCreateInstance が ${hresultText(hr)} を返しました`);
  }

  const self = created[0];
  const pointerSize = koffi.sizeof(voidPtr);
  const vtable = koffi.decode(self, voidPtr);
  const slot = (index) => koffi.decode(vtable, index * pointerSize, voidPtr);

  const isOnCurrentDesktopSlot = slot(SLOT_IS_WINDOW_ON_CURRENT_VIRTUAL_DESKTOP);
  const readDesktopIdSlot = slot(SLOT_GET_WINDOW_DESKTOP_ID);
  const moveToDesktopSlot = slot(SLOT_MOVE_WINDOW_TO_DESKTOP);

  const isOnCurrentDesktopProto = koffi.proto(
    '__stdcall',
    'IsWindowOnCurrentVirtualDesktop',
    'int32',
    ['void *', 'intptr_t', koffi.out(koffi.pointer('int32'))],
  );
  // koffi.view は Electron が外部バッファを禁止しているので使わない。
  // 出力は JS オブジェクトで受け取る。
  const readDesktopIdProto = koffi.proto('__stdcall', 'GetWindowDesktopId', 'int32', [
    'void *',
    'intptr_t',
    koffi.out(guidPtr),
  ]);
  const moveToDesktopProto = koffi.proto('__stdcall', 'MoveWindowToDesktop', 'int32', [
    'void *',
    'intptr_t',
    guidPtr,
  ]);

  // 読み取ったデスクトップ ID。koffi.out が JS オブジェクトとして返す。
  let desktopId = null;
  const emptyGuid = () => ({
    Data1: 0,
    Data2: 0,
    Data3: 0,
    Data4: [0, 0, 0, 0, 0, 0, 0, 0],
  });

  return {
    foregroundWindow: () => GetForegroundWindow(),

    // 今のデスクトップに居るか。分からないときは null（= 何もしない）。
    isOnCurrentDesktop(hwnd) {
      const onCurrent = [0];
      const result = koffi.call(
        isOnCurrentDesktopSlot,
        isOnCurrentDesktopProto,
        self,
        hwnd,
        onCurrent,
      );
      if (result !== S_OK) return null;
      return !!onCurrent[0];
    },

    // hwnd の居るデスクトップ ID を読んで内部に持つ。戻り値は HRESULT。
    readDesktopId(hwnd) {
      // koffi.out の出力は、int と同じく1要素の配列で受け取る。
      const out = [emptyGuid()];
      const result = koffi.call(readDesktopIdSlot, readDesktopIdProto, self, hwnd, out);
      desktopId = result === S_OK ? out[0] : null;
      return result;
    },

    // 読んだ ID が空（GUID_NULL）かどうか。タスクバーに出ない窓などはこうなる。
    isDesktopIdEmpty() {
      if (!desktopId) return true;
      const tail = desktopId.Data4 || [];
      return (
        desktopId.Data1 === 0 &&
        desktopId.Data2 === 0 &&
        desktopId.Data3 === 0 &&
        tail.every((byte) => byte === 0)
      );
    },

    // 読んだ ID の文字列。デスクトップが変わったかの判定に使う。
    desktopIdText() {
      if (!desktopId) return '';
      const tail = desktopId.Data4 || [];
      return [desktopId.Data1, desktopId.Data2, desktopId.Data3, ...tail].join('-');
    },

    // 内部に持っている ID のデスクトップへ動かす。戻り値は HRESULT。
    moveToReadDesktop(hwnd) {
      if (!desktopId) return 0x80004005;
      return koffi.call(moveToDesktopSlot, moveToDesktopProto, self, hwnd, desktopId);
    },
  };
};

// 表示中で最小化もされていないウィンドウを、今の仮想デスクトップへ追従させる。
// getWindows() は追従したいウィンドウ（null 混在可）を返す関数。
const startVirtualDesktopFollow = (getWindows) => {
  if (process.platform !== 'win32') return { stop: () => {} };

  let manager = null;
  let comUnavailable = false;
  let timer = null;
  let intervalMs = FOLLOW_INTERVAL_MS;
  let stopped = false;
  // 探査窓の結果待ち。この間は次の巡回を始めない。
  let probePending = false;
  let creatingProbe = false;
  // 直前に見えていたデスクトップ。変わったらタスクバーに出ない窓も連れて行く。
  let lastDesktopId = null;

  const ensureManager = () => {
    if (manager || comUnavailable) return manager;
    try {
      manager = createDesktopManager();
    } catch (e) {
      // 仮想デスクトップに触れないだけ。アプリは普通に動かす。
      comUnavailable = true;
      console.log('仮想デスクトップの追従をやめます（COM を使えません）', e);
    }
    return manager;
  };

  const slowDown = (reason) => {
    intervalMs = Math.min(intervalMs * 4, MAX_INTERVAL_MS);
    console.log(`仮想デスクトップへの移動に失敗しました（次は ${intervalMs}ms 後）`, reason);
  };

  const schedule = () => {
    if (stopped || comUnavailable || probePending || timer) return;
    timer = setTimeout(tick, intervalMs);
  };

  // 止まっている追従を起こす。トレイから戻したときや最小化を解いたときに呼ぶ。
  // 失敗で間隔が伸びていても、表示に戻った直後は 0.5 秒で試す。
  const wake = () => {
    intervalMs = FOLLOW_INTERVAL_MS;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    schedule();
  };

  // トレイに隠れている窓と最小化中の窓は動かさない。
  const followTargets = () =>
    (getWindows() || []).filter(
      (win) => win && !win.isDestroyed() && win.isVisible() && !win.isMinimized(),
    );

  // 前景ウィンドウから今のデスクトップ ID を借りる。借りられなければ null。
  // 借りられたら manager の中にその ID が残るので、そのまま移動に使える。
  const borrowDesktopIdFromForeground = () => {
    const hwnd = manager.foregroundWindow();
    if (!hwnd) return null;
    // 前景ウィンドウが今のデスクトップに居ることを確かめてから ID を使う。
    // デスクトップ切り替えの途中だと、まだ前の画面の窓が前景のことがある。
    if (manager.isOnCurrentDesktop(hwnd) !== true) return null;
    if (manager.readDesktopId(hwnd) !== S_OK || manager.isDesktopIdEmpty()) return null;
    return manager.desktopIdText();
  };

  // manager が持っている ID のデスクトップへまとめて動かす。失敗した理由を返す。
  const moveToReadDesktop = (windows) => {
    let failure = null;
    for (const win of windows) {
      const hwnd = nativeHandleOf(win);
      if (hwnd === null) continue;
      const result = manager.moveToReadDesktop(hwnd);
      if (result !== S_OK) {
        failure = `MoveWindowToDesktop ${hresultText(result)}`;
        continue;
      }
      // 常時最前面の窓は、移った先で他のウィンドウに埋もれることがあるので前へ出す。
      // focus は呼ばない（作業中のアプリから入力を奪ってしまう）。
      if (win.isAlwaysOnTop()) win.moveTop();
    }
    return failure;
  };

  // 前景ウィンドウから ID を借りられないときの逃げ道。
  // 新しい窓は必ず今のデスクトップに生まれるので、1x1 の窓を出して ID を借りる。
  // 出した直後はまだ ID が付かないので、少し待ってから読む。
  const startProbePass = () => {
    // 探査窓を出すと show が飛ぶので、巡回を止めてから作る
    probePending = true;
    let probe = null;
    try {
      creatingProbe = true;
      probe = new BrowserWindow(PROBE_WINDOW_OPTIONS);
      creatingProbe = false;
      // showInactive なら前面もフォーカスも奪わない。ただし表示しないと ID が付かない。
      probe.showInactive();
    } catch (e) {
      creatingProbe = false;
      probePending = false;
      if (probe && !probe.isDestroyed()) probe.destroy();
      slowDown(e);
      schedule();
      return;
    }

    setTimeout(() => {
      probePending = false;
      try {
        if (stopped) return;
        const hwnd = nativeHandleOf(probe);
        const result = hwnd === null ? null : manager.readDesktopId(hwnd);
        if (result !== S_OK || manager.isDesktopIdEmpty()) {
          slowDown(`GetWindowDesktopId ${result === null ? '(探査窓なし)' : hresultText(result)}`);
          return;
        }
        lastDesktopId = manager.desktopIdText();
        const failure = moveToReadDesktop(followTargets());
        if (failure) slowDown(failure);
        else intervalMs = FOLLOW_INTERVAL_MS;
      } catch (e) {
        slowDown(e);
      } finally {
        // 探査窓は用が済んだらすぐ捨てる
        if (probe && !probe.isDestroyed()) probe.destroy();
        schedule();
      }
    }, PROBE_SETTLE_MS);
  };

  // 1 回分の追従。false を返したら間隔処理を止める（wake() か探査窓が再開する）。
  const followOnce = () => {
    const targets = followTargets();
    // 対象が無い間はタイマーも止める。再表示や最小化解除で wake() が起こす。
    if (!targets.length) return false;
    if (!ensureManager()) return false;

    const strays = targets.filter((win) => {
      const hwnd = nativeHandleOf(win);
      return hwnd !== null && manager.isOnCurrentDesktop(hwnd) === false;
    });

    const currentDesktopId = borrowDesktopIdFromForeground();
    if (!currentDesktopId) {
      // 動かす相手が居ないなら探査窓も要らない。次の巡回を待つ。
      if (!strays.length) return true;
      startProbePass();
      return false;
    }

    // タスクバーに出ない窓（ミニモード）は ID が空で、今どのデスクトップに居るかが
    // 分からない。デスクトップが変わったときは、まとめて連れて行く。
    const switched = lastDesktopId !== null && lastDesktopId !== currentDesktopId;
    lastDesktopId = currentDesktopId;

    const movers = switched ? targets : strays;
    if (!movers.length) {
      intervalMs = FOLLOW_INTERVAL_MS;
      return true;
    }

    const failure = moveToReadDesktop(movers);
    if (failure) slowDown(failure);
    else intervalMs = FOLLOW_INTERVAL_MS;
    return true;
  };

  function tick() {
    timer = null;
    if (stopped || probePending) return;
    let keepGoing = false;
    try {
      keepGoing = followOnce();
    } catch (e) {
      // 追従のせいでアプリを落とさない
      keepGoing = true;
      slowDown(e);
    }
    if (keepGoing) schedule();
  }

  const watch = (win) => {
    win.on('show', wake);
    win.on('restore', wake);
  };

  for (const win of BrowserWindow.getAllWindows()) watch(win);
  app.on('browser-window-created', (_event, win) => {
    if (creatingProbe) return; // 探査窓は追従の対象外
    watch(win);
  });

  schedule();

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
};

module.exports = { startVirtualDesktopFollow };
