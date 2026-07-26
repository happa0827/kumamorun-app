import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getDatabase, ref, set, onValue, runTransaction, get } from 'firebase/database';
import { firebaseConfig } from './firebase-config.js';

// --- Firebase 初期化 ---
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

// ページをまたいで設定を渡すためのキー
const STORAGE_KEY = 'countdown';
// 遊び/休憩の既定時間を保存するキー
const SETTINGS_KEY = 'settings';
// スタート制限（昼休憩・完全終了）の設定を保存するキー。平日/週末で別々に持つ。
// { weekday: { lunchStart, lunchEnd, endTime }, weekend: { lunchStart, lunchEnd, endTime } }
const RESTRICTIONS_KEY = 'restrictions';

// 土(6)・日(0)を週末とする
const isWeekend = () => {
  const day = new Date().getDay();
  return day === 0 || day === 6;
};
// その日の遊び回数・失敗回数を保存するキー（{ date, plays, failures }）
const DAILY_KEY = 'dailyStats';

// 現在時刻を "HH:MM" で返す（ゼロ埋め）
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// スタートできない場合はその理由文字列を、可能なら null を返す。
// 昼休憩：開始〜終了の時間帯は不可。完全終了：指定時刻以降は翌日（日付が変わる）まで不可。
const getStartBlockReason = () => {
  const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || '{}');
  const weekend = isWeekend();
  const r = (weekend ? all.weekend : all.weekday) || {};
  const label = weekend ? '週末' : '平日';
  const cur = nowHHMM();
  if (r.lunchStart && r.lunchEnd && r.lunchStart <= cur && cur < r.lunchEnd) {
    return `${label}の昼休憩中（${r.lunchStart}〜${r.lunchEnd}）はスタートできません`;
  }
  if (r.endTime && cur >= r.endTime) {
    return `${label}の終了時刻（${r.endTime}）を過ぎたため、明日までスタートできません`;
  }
  return null;
};

// 次に来るスタート制限の境界（昼休憩開始 or 完全終了）までの秒数と種類を返す。
// まだ設定がない・境界がすべて過ぎている場合は null。
const nextRestrictionBoundary = () => {
  const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || '{}');
  const r = (isWeekend() ? all.weekend : all.weekday) || {};
  const now = new Date();
  // "HH:MM" までの残り秒数（今より未来のときだけ返す）
  const secUntil = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = Math.floor((target - now) / 1000);
    return diff > 0 ? diff : null;
  };
  const candidates = [];
  const ls = secUntil(r.lunchStart);
  if (ls != null) candidates.push({ sec: ls, kind: '昼休憩' });
  const et = secUntil(r.endTime);
  if (et != null) candidates.push({ sec: et, kind: '終了' });
  if (!candidates.length) return null;
  // 一番近い境界を採用する
  return candidates.reduce((a, b) => (b.sec < a.sec ? b : a));
};

// 今が昼休憩中（開始〜終了の時間帯）なら、終了までの秒数を返す。そうでなければ null。
const lunchBreakRemaining = () => {
  const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || '{}');
  const r = (isWeekend() ? all.weekend : all.weekday) || {};
  if (!r.lunchStart || !r.lunchEnd) return null;
  const now = new Date();
  const at = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const t = new Date(now);
    t.setHours(h, m, 0, 0);
    return t;
  };
  const start = at(r.lunchStart);
  const end = at(r.lunchEnd);
  if (now >= start && now < end) return Math.ceil((end - now) / 1000);
  return null;
};

// 境界チェックを最後に実行した時刻（ms）を保持するキー
const BOUNDARY_WATCH_KEY = 'boundaryWatch';
// 前回チェックからこれ以上空いていたら、過去の境界を掘り返さない（起動直後・別画面から復帰した直後など）
const BOUNDARY_MAX_GAP_MS = 60 * 1000;

// 各制限時刻（昼休憩開始・昼休憩終了・完全終了）を「前回チェック〜今」の間に
// 通過したかどうかを返す。時刻ベースのカウントダウンが0になった瞬間の検知に使う。
// 「今ちょうど過ぎた（0〜2秒以内）」で判定すると、setInterval が1回でも遅延・欠落した
// ときに境界の瞬間を丸ごと取りこぼして無音になるため、通過区間で判定する。
const restrictionJustPassed = () => {
  const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || '{}');
  const r = (isWeekend() ? all.weekend : all.weekday) || {};
  const now = Date.now();
  const prev = Number(JSON.parse(localStorage.getItem(BOUNDARY_WATCH_KEY) || '{}').at);
  const watching = Number.isFinite(prev) && prev <= now && now - prev < BOUNDARY_MAX_GAP_MS;
  const since = watching ? prev : now - 2000;
  localStorage.setItem(BOUNDARY_WATCH_KEY, JSON.stringify({ at: now }));
  const passed = (hhmm) => {
    if (!hhmm) return false;
    const [h, m] = hhmm.split(':').map(Number);
    const t = new Date();
    t.setHours(h, m, 0, 0);
    const at = t.getTime();
    return at > since && at <= now;
  };
  return {
    lunchStart: passed(r.lunchStart),
    lunchEnd: passed(r.lunchEnd),
    endTime: passed(r.endTime),
  };
};

// 秒数を mm:ss 形式に変換する（例: 90 -> "01:30"）
const formatTime = (totalSec) => {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 設定で選ばれた出力先スピーカーの deviceId（空文字なら OS の既定スピーカー）
const getSpeakerId = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').speakerId || '';

// 通知音（アラーム）を鳴らす。音声ファイル不要で Web Audio から生成する。
// durationSec 秒のあいだ「ピッ・ピッ」と断続的に鳴らし続ける。
// speakerIdOverride を渡すと設定より優先する（設定画面のテスト再生用）。
const playBeep = async (durationSec = 10, speakerIdOverride) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // 出力先スピーカーを切り替える（未指定・失敗時は既定スピーカーのまま鳴らす）
    const speakerId = speakerIdOverride !== undefined ? speakerIdOverride : getSpeakerId();
    if (speakerId && ctx.setSinkId) {
      try {
        await ctx.setSinkId(speakerId);
      } catch (e) {
        console.log('スピーカーの切り替えに失敗しました（既定スピーカーで鳴らします）', e);
      }
    }
    // 非表示ウィンドウでは AudioContext が suspended で始まり音が出ないことがあるため復帰させる
    if (ctx.state === 'suspended' && ctx.resume) await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880; // 高めの「ピー」

    // 0.4秒鳴らして0.3秒休む、を繰り返して断続ビープにする
    const beepOn = 0.4;
    const beepOff = 0.3;
    const cycle = beepOn + beepOff;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    for (let t = 0; t < durationSec; t += cycle) {
      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.2, start); // 鳴らす
      gain.gain.setValueAtTime(0, start + beepOn); // 止める
    }

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSec);
    console.log('音を再生しました');
  } catch (e) {
    console.log('音の再生に失敗しました', e);
  }
};

// --- index.html: スタートで設定画面へ / アカウント画面へ / 渡されたタイマーを表示 ---
const timer = document.getElementById('timer');
if (timer) {
  timer.addEventListener('click', () => {
    window.location.href = 'index2.html';
  });
}

const account = document.getElementById('account');
if (account) {
  account.addEventListener('click', () => {
    window.location.href = 'account.html';
  });
}

const setting = document.getElementById('setting');
if (setting) {
  setting.addEventListener('click', () => {
    window.location.href = 'index3.html';
  });
}

const alarm = document.getElementById('alarm');
if (alarm) {
  alarm.addEventListener('click', () => {
    window.location.href = 'alarm.html';
  });
}

const remainingEl = document.getElementById('remaining');
if (remainingEl) {
  const labelEl = document.getElementById('label');
  const toggleBtn = document.getElementById('toggle');
  const evoEl = document.getElementById('evolution');
  const flowersEl = document.getElementById('flowers');
  const failuresEl = document.getElementById('failures');
  const kumamoruEl = document.getElementById('kumamoru');

  // --- 集中モード: 残り時間だけを全画面に大きく表示する ---
  // 表示ロジック（updateDisplay / renderIdle など）が更新する #remaining・#label を
  // そのままミラーするだけなので、既存のタイマー描画には手を入れない。
  const focusBtn = document.getElementById('focus');
  const focusOverlay = document.getElementById('focus-overlay');
  if (focusBtn && focusOverlay) {
    const focusRemainingEl = document.getElementById('focus-remaining');
    const focusLabelEl = document.getElementById('focus-label');
    const focusExitBtn = document.getElementById('focus-exit');

    const syncFocus = () => {
      focusRemainingEl.textContent = remainingEl.textContent;
      if (focusLabelEl && labelEl) focusLabelEl.textContent = labelEl.textContent;
    };
    // #remaining / #label の文字が変わるたびに集中モードの表示へ反映する
    const focusObserver = new MutationObserver(syncFocus);
    focusObserver.observe(remainingEl, { childList: true, characterData: true, subtree: true });
    if (labelEl) {
      focusObserver.observe(labelEl, { childList: true, characterData: true, subtree: true });
    }

    const openFocus = () => {
      syncFocus();
      focusOverlay.hidden = false;
      if (window.kumamorunAPI) window.kumamorunAPI.setFullscreen(true);
    };
    const closeFocus = () => {
      focusOverlay.hidden = true;
      if (window.kumamorunAPI) window.kumamorunAPI.setFullscreen(false);
    };

    focusBtn.addEventListener('click', openFocus);
    focusExitBtn.addEventListener('click', closeFocus);
    // オーバーレイのどこをクリックしても閉じる（Esc でも閉じる）
    focusOverlay.addEventListener('click', (e) => {
      if (e.target === focusOverlay) closeFocus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !focusOverlay.hidden) closeFocus();
    });
  }

  // 稼働中タイマーの状態を保存するキー（ページ遷移をまたいで継続させる）
  // { label, duration, running, endAt, remaining, warned, finished, eyeBreaksSent }
  const TIMER_KEY = 'timerState';
  const loadTimerState = () => JSON.parse(localStorage.getItem(TIMER_KEY) || 'null');
  const saveTimerState = (s) => localStorage.setItem(TIMER_KEY, JSON.stringify(s));

  // 20-20-20ルールの通知が有効か（設定画面のチェックボックス）
  // ※ settings は後方で定義されるため、ここでは localStorage から直接読む
  const notify20Enabled = !!JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').notify20;
  const EYE_BREAK_INTERVAL_SEC = 20 * 60; // 20分ごと

  // 稼働中なら壁時計（終了時刻）から、停止中なら保存済み残り秒数から、残り秒を計算する
  const currentRemaining = (s) =>
    s.running ? Math.max(0, Math.ceil((s.endAt - Date.now()) / 1000)) : Math.max(0, s.remaining);

  // 進化段階のキャッシュ。DB 往復の遅延を避け、開いた瞬間に前回値でキャラを描画するため。
  const EVOLUTION_KEY = 'evolution';
  const cachedEvolution = () => {
    const v = Number(localStorage.getItem(EVOLUTION_KEY));
    return Number.isFinite(v) ? v : 0;
  };

  // ログイン中ユーザーを保持し、進化・花をリアルタイム表示する
  let currentUser = null;
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      onValue(ref(db, `users/${user.uid}/evolution`), (snap) => {
        const e = snap.val() ?? 0;
        // localStorage と DB が違うときだけキャッシュを更新して描画し直す
        if (e !== cachedEvolution()) {
          localStorage.setItem(EVOLUTION_KEY, String(e));
          if (evoEl) evoEl.textContent = e;
          // 開花当日はその花、それ以外は進化段階の成長画像を表示する
          showCharacterImage(e);
        }
      });
      onValue(ref(db, `users/${user.uid}/flowers`), (snap) => {
        if (flowersEl) flowersEl.textContent = snap.val() ?? 0;
      });
      // クラウドの当日統計を取り込んでから、日付が変わっていれば前日を評価する
      get(ref(db, `users/${user.uid}/dailyStats`))
        .then((snap) => {
          const merged = mergeDailyStats(
            JSON.parse(localStorage.getItem(DAILY_KEY) || 'null'),
            snap.val(),
          );
          if (merged) {
            localStorage.setItem(DAILY_KEY, JSON.stringify(merged));
            set(ref(db, `users/${user.uid}/dailyStats`), merged);
          }
          evaluateDailyRollover();
        })
        .catch(() => evaluateDailyRollover());
    } else {
      // 未ログインでも localStorage の当日統計から失敗回数を表示する
      renderFailures();
    }
  });

  // 遊び完走からこの時間内に休憩を完走できなければ「失敗」として記録する
  const REWARD_WINDOW_MS = 3 * 60 * 1000;
  const PLAY_FINISHED_KEY = 'playFinishedAt';

  // 遊び完走後の「休憩の猶予（3分）」の残り秒。猶予中でなければ null。
  // 遊び完走時のみ playFinishedAt が入るので、その存在＝猶予中を意味する。
  const rewardWindowRemaining = () => {
    const playFinishedAt = Number(localStorage.getItem(PLAY_FINISHED_KEY));
    if (!playFinishedAt) return null;
    const left = Math.ceil((playFinishedAt + REWARD_WINDOW_MS - Date.now()) / 1000);
    return left > 0 ? left : null;
  };

  // --- 進化・お花の仕組み ---
  // 「その日、3分以内に休憩を押せなかった回数が0回」なら翌日にキャラが進化。
  // 7回進化すると開花し、お花を獲得して進化カウントは0に戻る。
  const EVOLVE_MAX = 7; // この回数の進化で開花

  // 成長段階の画像（0=種子 … 5=つぼみ大きく）。評価値6も最後の画像を流用する。
  const GROWTH_IMAGES = [
    'src/evo/01_種子.png',
    'src/evo/02_子葉.png',
    'src/evo/03本葉.png',
    'src/evo/04_本葉いっぱい.png',
    'src/evo/05_つぼみ.png',
    'src/evo/06_つぼみ大きく.png',
  ];

  // 開花で咲く花（10 ソメイヨシノは使わない）
  const FLOWER_IMAGES = {
    '07': 'src/evo/07_タンポポ.png',
    '08': 'src/evo/08_ボタン.png',
    '09': 'src/evo/09_青いヒガンバナ.png',
    '11': 'src/evo/11_夜桜.png',
  };
  const FLOWER_NAMES = { '07': 'タンポポ', '08': 'ボタン', '09': '青いヒガンバナ', '11': '夜桜' };

  // 開花で咲く花を抽選する。07/08/09 が各33%、11 夜桜が1%。
  const pickFlower = () => {
    const r = Math.random() * 100;
    if (r < 33) return '07';
    if (r < 66) return '08';
    if (r < 99) return '09';
    return '11'; // 1% の当たり
  };

  // ローカル日付を "YYYY-MM-DD" で返す（UTCではなく端末の日付）
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 今日開花した花を保存するキー（{ flower, date }）。開花した日は一日中その花を表示する。
  const BLOOM_KEY = 'bloomDisplay';

  // キャラ画像を更新する。開花した当日はその花を、それ以外は成長段階の画像を表示する。
  const showCharacterImage = (e) => {
    if (!kumamoruEl) return;
    const bloom = JSON.parse(localStorage.getItem(BLOOM_KEY) || 'null');
    if (bloom && bloom.date === todayStr() && FLOWER_IMAGES[bloom.flower]) {
      kumamoruEl.src = FLOWER_IMAGES[bloom.flower];
    } else {
      kumamoruEl.src = GROWTH_IMAGES[Math.min(e, GROWTH_IMAGES.length - 1)];
    }
  };

  // 起動直後にキャッシュ済みの進化段階で即描画する（ログイン/DB応答を待たない）。
  // 実際の値と違えば、後で来る onValue が食い違いを検知して描き替える。
  {
    const e = cachedEvolution();
    if (evoEl) evoEl.textContent = e;
    showCharacterImage(e);
  }

  // 時刻ベースのカウントダウンが0になった瞬間に一度だけ通知＋音を鳴らす。
  // 毎秒の判定や画面遷移で重複しないよう、日付＋種類で鳴動済みを記録する。
  const RANG_KEY = 'boundaryRang';
  const ringOnce = (id, title, body) => {
    const store = JSON.parse(localStorage.getItem(RANG_KEY) || '{}');
    if (store.date !== todayStr()) {
      store.date = todayStr();
      store.ids = [];
    }
    if (store.ids.includes(id)) return;
    store.ids.push(id);
    localStorage.setItem(RANG_KEY, JSON.stringify(store));
    // 非表示（トレイ常駐）中でも気づけるようウィンドウを前面に出してから鳴らす
    if (window.kumamorunAPI) window.kumamorunAPI.surfaceWindow();
    new Notification(title, { body });
    playBeep();
  };

  // 制限時刻（昼休憩開始/昼休憩終了/完全終了）の通過を監視する唯一のループ。
  // タイマーの稼働状態に関係なく index.html にいる限り常に回す。
  // 以前はタイマー稼働中の tick と待機中の renderIdle に判定が分かれていたため、
  // 「タイマー完走後」「一時停止中」はどちらのループも回らず、時刻が来ても無音だった。
  //
  // restrictionJustPassed() は前回チェック時刻を進める副作用があるので、
  // 呼ぶのはこのループだけに限定する（複数箇所で呼ぶと通過を食い合って取りこぼす）。
  let onBoundary = null; // 遊びタイマー稼働中だけセットされ、境界でタイマーを打ち切る
  const watchBoundaries = () => {
    const p = restrictionJustPassed();
    if (p.lunchStart || p.endTime) {
      const kind = p.lunchStart ? '昼休憩' : '終了';
      const stopped = onBoundary ? onBoundary(kind) : false;
      const body = stopped
        ? '遊びを終了します。お疲れさまでした！'
        : p.lunchStart
          ? '休憩しよう！'
          : '今日はここまで。お疲れさまでした！';
      ringOnce(p.lunchStart ? 'lunchStart' : 'endTime', `${kind}の時間になりました`, body);
    }
    if (p.lunchEnd) {
      ringOnce('lunchEnd', '昼休憩が終わりました', 'また遊べるよ！');
    }
  };

  // キャラを1段階進化させる。EVOLVE_MAX に達したら開花し、花を付与して0に戻す。
  const evolve = () => {
    if (!currentUser) {
      console.log('進化条件を満たしましたが、未ログインのため保存できません');
      return;
    }
    let bloomed = false;
    runTransaction(ref(db, `users/${currentUser.uid}/evolution`), (cur) => {
      let e = (cur || 0) + 1;
      if (e >= EVOLVE_MAX) {
        bloomed = true;
        e = 0;
      }
      return e;
    }).then(() => {
      if (bloomed) {
        // 開花：花を抽選。夜桜(11)だけ花を2つ獲得。
        const flower = pickFlower();
        const gain = flower === '11' ? 2 : 1;
        runTransaction(ref(db, `users/${currentUser.uid}/flowers`), (c) => (c || 0) + gain);
        // 咲いた花を当日分として保存し、その日はずっとこの花を表示する
        localStorage.setItem(BLOOM_KEY, JSON.stringify({ flower, date: todayStr() }));
        if (kumamoruEl) kumamoruEl.src = FLOWER_IMAGES[flower];
        new Notification('お花が咲いた！🌸', {
          body: `${FLOWER_NAMES[flower]} が咲きました！お花+${gain}`,
        });
        playBeep(1);
      } else {
        new Notification('進化した！✨', { body: 'クマモルが育ったよ！' });
        playBeep(1);
      }
    });
  };

  // ローカルとクラウドの当日統計をマージする。
  // 同じ日付なら回数の多い方を、日付が違えば新しい日付（YYYY-MM-DD の辞書順）を採用する。
  const mergeDailyStats = (a, b) => {
    if (!a) return b || null;
    if (!b) return a;
    if (a.date === b.date) {
      return {
        date: a.date,
        plays: Math.max(a.plays, b.plays),
        failures: Math.max(a.failures, b.failures),
      };
    }
    return a.date > b.date ? a : b;
  };

  // 今日の統計を取得する。日付が変わっていたら前日を評価してからリセットする。
  const getDailyStats = () => {
    let stats = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
    const today = todayStr();
    if (!stats || stats.date !== today) {
      // 前日に遊びをしていて失敗0回だったら進化させる
      if (stats && stats.plays > 0 && stats.failures === 0) {
        evolve();
      }
      // 前日の遊びの猶予は日をまたいだ時点で無効。翌日の別の休憩が前日分の
      // 遅延失敗として誤カウントされないよう、期限切れの猶予を掃除する。
      localStorage.removeItem(PLAY_FINISHED_KEY);
      stats = { date: today, plays: 0, failures: 0 };
      localStorage.setItem(DAILY_KEY, JSON.stringify(stats));
    }
    return stats;
  };

  // 当日の「3分以内に休憩できなかった回数」を画面に表示する（副作用なし）
  const renderFailures = () => {
    if (!failuresEl) return;
    const stats = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
    failuresEl.textContent = stats && stats.date === todayStr() ? stats.failures : 0;
  };

  const saveDailyStats = (stats) => {
    localStorage.setItem(DAILY_KEY, JSON.stringify(stats));
    renderFailures();
    // ログイン中はクラウドにも保存して端末間で同期する
    if (currentUser) {
      set(ref(db, `users/${currentUser.uid}/dailyStats`), stats)
        .then(() => console.log('当日の統計をクラウドに保存しました', stats))
        .catch((e) => console.log('当日の統計のクラウド保存に失敗しました', e));
    }
  };

  // 日付をまたいでいれば前日を評価する（ログイン確定時に呼ぶ）
  const evaluateDailyRollover = () => {
    getDailyStats();
    renderFailures();
  };

  const recordPlay = () => {
    const stats = getDailyStats();
    stats.plays += 1;
    saveDailyStats(stats);
  };

  const recordFailure = () => {
    const stats = getDailyStats();
    stats.failures += 1;
    saveDailyStats(stats);
    console.log('3分以内に休憩できませんでした（今日の失敗回数を+1）');
  };

  const handleTimerFinished = (label) => {
    if (label === '遊び') {
      // 遊び完走の時刻を記録し、今日の遊び回数を+1する
      localStorage.setItem(PLAY_FINISHED_KEY, String(Date.now()));
      recordPlay();
    } else if (label === '休憩') {
      const playFinishedAt = Number(localStorage.getItem(PLAY_FINISHED_KEY));
      localStorage.removeItem(PLAY_FINISHED_KEY);
      if (playFinishedAt && Date.now() - playFinishedAt > REWARD_WINDOW_MS) {
        // 遊びは完走したが、休憩が3分を超えた → 失敗
        recordFailure();
      }
      // 3分以内に休憩を完走できた場合は成功（失敗として記録しない）
    }
  };

  // 遊び完走後、休憩を「開始せず」放置しても失敗にはしない（放置＝中立、翌日評価は成功日扱い）。
  // 失敗になるのは「休憩を開始したが3分を超えて完走」した場合のみ（handleTimerFinished('休憩')）。

  // index2.html からの開始要求があれば、新しいタイマー状態を作る
  const startRequest = localStorage.getItem(STORAGE_KEY);
  if (startRequest) {
    // 一度読んだら消す（リロードで勝手に作り直さないように）
    localStorage.removeItem(STORAGE_KEY);
    const { duration, label } = JSON.parse(startRequest);
    saveTimerState({
      label,
      duration,
      running: true,
      endAt: Date.now() + duration * 1000,
      remaining: duration,
      warned: false,
      finished: false,
      eyeBreaksSent: 0,
    });
  }

  // 保存済みのタイマー状態を表示・駆動する（ページ遷移をまたいで継続）
  const runActiveTimer = (state) => {
    // 「まもなく終了」を知らせる残り秒数（全体の20%）
    const warnAt = Math.max(1, Math.floor(state.duration * 0.2));

    // 残り時間とラベルを画面に反映する。
    // 遊びタイマー中に、タイマー終了より先に昼休憩開始/完全終了が来るなら、
    // その境界までの秒数（短い方）を表示し、ラベルで何までかを示す。
    const updateDisplay = () => {
      // 昼休憩中は最優先で「終了まで」を表示する
      const lunch = lunchBreakRemaining();
      if (lunch != null) {
        remainingEl.textContent = formatTime(lunch);
        if (labelEl) labelEl.textContent = '昼休憩中（終了まで）';
        return;
      }
      const remaining = currentRemaining(state);
      const boundary = state.label === '遊び' ? nextRestrictionBoundary() : null;
      if (boundary && boundary.sec < remaining) {
        remainingEl.textContent = formatTime(boundary.sec);
        if (labelEl) labelEl.textContent = `${state.label}（${boundary.kind}まで）`;
      } else {
        remainingEl.textContent = formatTime(remaining);
        if (labelEl) labelEl.textContent = state.label;
      }
    };
    updateDisplay();

    let tickId = null;

    // 遊び完走後、休憩の猶予（3分）の残り時間を #remaining に表示し続ける。
    // 猶予が切れたら「時間切れ！」に戻す。
    let rewardId = null;
    const startRewardCountdown = () => {
      const render = () => {
        const left = rewardWindowRemaining();
        if (left == null) {
          if (rewardId) clearInterval(rewardId);
          rewardId = null;
          remainingEl.textContent = '時間切れ！';
          if (labelEl) labelEl.textContent = state.label;
          return;
        }
        remainingEl.textContent = formatTime(left);
        if (labelEl) labelEl.textContent = '休憩の猶予';
      };
      render();
      rewardId = setInterval(render, 1000);
    };

    const finish = () => {
      if (tickId) clearInterval(tickId);
      tickId = null;
      onBoundary = null;
      state.running = false;
      state.remaining = 0;
      state.finished = true;
      saveTimerState(state);
      remainingEl.textContent = '時間切れ！';
      if (toggleBtn) toggleBtn.disabled = true;
      // 非表示（トレイ常駐）中でも気づけるようウィンドウを前面に出してから鳴らす
      if (window.kumamorunAPI) window.kumamorunAPI.surfaceWindow();
      new Notification(`${state.label} が終わりました`, { body: 'お疲れさまでした！' });
      playBeep();
      handleTimerFinished(state.label);
      // 遊び完走後は休憩の猶予（3分）の残りを表示し続ける
      if (state.label === '遊び') startRewardCountdown();
    };

    // 遊び中に「昼休憩開始」または「完全終了」の時刻へ到達したら、そこで終了扱いにする。
    // 鳴らすのは watchBoundaries 側。打ち切られた遊びは handleTimerFinished を呼ばないので
    // 完走扱いにならない（進化の対象外）。
    const stopAtBoundary = (kind) => {
      if (!state.running || state.label !== '遊び') return false;
      if (tickId) clearInterval(tickId);
      tickId = null;
      onBoundary = null;
      state.running = false;
      state.finished = true;
      state.remaining = 0;
      saveTimerState(state);
      if (toggleBtn) toggleBtn.disabled = true;
      remainingEl.textContent = `${kind}の時間です`;
      if (labelEl) labelEl.textContent = state.label;
      return true;
    };

    const tick = () => {
      const remaining = currentRemaining(state);
      updateDisplay();
      // 20-20-20ルール：遊びタイマー中、経過20分ごとに目の休憩を知らせる
      // （例: 60分なら残り40分・残り20分の時点）。終了と重なる回は finish 側に任せる。
      if (notify20Enabled && state.running && state.label === '遊び' && remaining > 0) {
        const marks = Math.floor((state.duration - remaining) / EYE_BREAK_INTERVAL_SEC);
        if (marks > (state.eyeBreaksSent || 0)) {
          state.eyeBreaksSent = marks;
          saveTimerState(state);
          new Notification('20-20-20ルール', {
            body: '20秒間、20フィート（約6m）先を見て目を休めましょう👀',
          });
          playBeep(1);
        }
      }
      // 残りわずかになったら一度だけ知らせる
      if (state.running && !state.warned && remaining > 0 && remaining <= warnAt) {
        state.warned = true;
        saveTimerState(state);
        new Notification(`${state.label} まもなく終了`, { body: `残り${warnAt}秒です` });
        playBeep(1);
      }
      if (remaining <= 0) finish();
    };

    // 別画面にいる間にすでに時間切れになっていたら、この時点で終了処理する
    if (state.running && currentRemaining(state) <= 0) {
      finish();
      return;
    }

    if (state.running) {
      onBoundary = stopAtBoundary;
      tickId = setInterval(tick, 1000);
    }

    // 一時停止・再開のトグル
    if (toggleBtn) {
      toggleBtn.textContent = state.running ? '一時停止' : '再開';
      toggleBtn.addEventListener('click', () => {
        if (state.running) {
          // 一時停止：残り秒数を確定して保存する
          state.remaining = currentRemaining(state);
          state.running = false;
          saveTimerState(state);
          if (tickId) clearInterval(tickId);
          tickId = null;
          onBoundary = null;
          toggleBtn.textContent = '再開';
        } else {
          // 再開：残り秒数から終了時刻を計算し直す
          if (state.remaining <= 0) return;
          state.endAt = Date.now() + state.remaining * 1000;
          state.running = true;
          saveTimerState(state);
          onBoundary = stopAtBoundary;
          tickId = setInterval(tick, 1000);
          toggleBtn.textContent = '一時停止';
        }
      });
    }
  };

  const timerState = loadTimerState();
  if (timerState && !timerState.finished) {
    runActiveTimer(timerState);
  } else {
    // タイマーが動いていない（または終了済みの）ときはボタンを無効化
    if (toggleBtn) toggleBtn.disabled = true;
    // 昼休憩中は、休憩をスタートしなくても自動で「昼休憩 終了まで」を毎秒表示する
    // 表示だけを担当する（制限時刻の鳴動は watchBoundaries が常時見ている）
    const renderIdle = () => {
      const lunch = lunchBreakRemaining();
      if (lunch != null) {
        remainingEl.textContent = formatTime(lunch);
        if (labelEl) labelEl.textContent = '昼休憩中（終了まで）';
        return;
      }
      // 遊び完走後に別画面から戻った/リロードした場合も、休憩の猶予（3分）を表示する
      const reward = rewardWindowRemaining();
      if (reward != null) {
        remainingEl.textContent = formatTime(reward);
        if (labelEl) labelEl.textContent = '休憩の猶予';
        return;
      }
      if (timerState && timerState.finished) {
        if (labelEl) labelEl.textContent = timerState.label;
        remainingEl.textContent = '時間切れ！';
      } else {
        if (labelEl) labelEl.textContent = '';
        remainingEl.textContent = '-';
      }
    };
    renderIdle();
    setInterval(renderIdle, 1000);
  }

  // 制限時刻の監視はタイマーの稼働状態と無関係に常に回す。
  // （タイマー稼働中／一時停止中／完走後／未稼働のどれでも鳴るようにするため）
  setInterval(watchBoundaries, 1000);
}

// --- index2.html: 秒数を設定して index.html へ渡す ---
const startBtn = document.getElementById('start');
const brakeBtn = document.getElementById('start-brake');
const timeInput = document.getElementById('time');

// 保存済みの既定時間（設定画面 index3 で保存したもの）
const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');

const sendToTimer = (label, fallbackSec) => {
  // 昼休憩中・完全終了後はスタートを禁止する
  const blockReason = getStartBlockReason();
  if (blockReason) {
    alert(blockReason);
    return;
  }
  // 入力が空なら設定画面で保存した既定値を使う
  let duration = Number(timeInput.value);
  if (!Number.isFinite(duration) || duration <= 0) {
    duration = Number(fallbackSec);
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    console.log('秒数を入力してください');
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration, label }));
  window.location.href = 'index.html';
};

if (startBtn) {
  startBtn.addEventListener('click', () => sendToTimer('遊び', settings.play));
}

if (brakeBtn) {
  brakeBtn.addEventListener('click', () => sendToTimer('休憩', settings.break));
}

// --- index3.html: 遊び/休憩の既定時間を保存 ---
const saveBtn = document.getElementById('save');
if (saveBtn) {
  const playInput = document.getElementById('play-time');
  const breakInput = document.getElementById('break-time');
  const notify20Input = document.getElementById('notify20');
  const speakerSelect = document.getElementById('speaker');
  const testSoundBtn = document.getElementById('test-sound');

  // 保存済みの設定があれば初期表示する
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (saved.play != null) playInput.value = saved.play;
  if (saved.break != null) breakInput.value = saved.break;
  if (notify20Input) notify20Input.checked = !!saved.notify20;

  // 出力先スピーカーの一覧を作る。
  // Chromium はマイク許可がないとデバイス名を空で返すため、空なら一度だけ許可を取って取り直す。
  const loadSpeakers = async () => {
    if (!speakerSelect || !navigator.mediaDevices) return;
    const listOutputs = async () =>
      (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audiooutput');

    let outputs = await listOutputs();
    if (outputs.some((d) => !d.label)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop()); // 名前の取得が目的なのですぐ止める
        outputs = await listOutputs();
      } catch (e) {
        console.log('デバイス名を取得できませんでした（番号で表示します）', e);
      }
    }

    speakerSelect.innerHTML = '';
    const addOption = (value, text) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = text;
      speakerSelect.appendChild(o);
    };
    addOption('', '既定のスピーカー');
    outputs.forEach((d, i) => {
      if (d.deviceId === 'default') return; // 既定は上で用意済み
      addOption(d.deviceId, d.label || `スピーカー ${i + 1}`);
    });
    // 保存済みの選択を復元する（機器が外れていれば既定に戻る）
    if (saved.speakerId) speakerSelect.value = saved.speakerId;
  };
  loadSpeakers();

  // 選んだスピーカーから実際に音が出るか確認できるようにする
  if (testSoundBtn) {
    testSoundBtn.addEventListener('click', () => {
      playBeep(1, speakerSelect ? speakerSelect.value : '');
    });
  }

  saveBtn.addEventListener('click', () => {
    const play = Number(playInput.value);
    const breakTime = Number(breakInput.value);
    const notify20 = notify20Input ? notify20Input.checked : false;
    const speakerId = speakerSelect ? speakerSelect.value : '';
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ play, break: breakTime, notify20, speakerId }),
    );
    console.log('設定を保存しました', { play, break: breakTime, notify20, speakerId });
    window.location.href = 'index.html';
  });
}

// --- alarm.html: 昼休憩・完全終了（スタート制限）の設定を保存 ---
const restrictSaveBtn = document.getElementById('restrict-save');
if (restrictSaveBtn) {
  // prefix は 'wd'（平日）/ 'we'（週末）。1グループ分の入力値を読み取る。
  const readGroup = (prefix) => {
    const val = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    return {
      lunchStart: val(`${prefix}-lunch-start`),
      lunchEnd: val(`${prefix}-lunch-end`),
      endTime: val(`${prefix}-end-time`),
    };
  };

  // 1グループ分の値をフォームに反映する
  const fillGroup = (prefix, g) => {
    if (!g) return;
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el && v) el.value = v;
    };
    set(`${prefix}-lunch-start`, g.lunchStart);
    set(`${prefix}-lunch-end`, g.lunchEnd);
    set(`${prefix}-end-time`, g.endTime);
  };

  // 保存済みの設定（平日・週末）をフォームに反映する
  const fillRestrictForm = (all) => {
    fillGroup('wd', all.weekday);
    fillGroup('we', all.weekend);
  };

  // まず localStorage の内容で初期表示する
  fillRestrictForm(JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || '{}'));

  // ログイン中はクラウドの保存済み設定を取り込んでフォームに反映する
  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    onValue(ref(db, `users/${user.uid}/restrictions`), (snap) => {
      const cloud = snap.val();
      if (!cloud) return;
      localStorage.setItem(RESTRICTIONS_KEY, JSON.stringify(cloud));
      fillRestrictForm(cloud);
    });
  });

  restrictSaveBtn.addEventListener('click', async () => {
    const r = { weekday: readGroup('wd'), weekend: readGroup('we') };
    localStorage.setItem(RESTRICTIONS_KEY, JSON.stringify(r));
    // ログイン中はクラウドにも保存して端末間で同期する。
    // set() は非同期なので、完了を待ってから画面遷移する（待たないと書き込みが中断される）。
    if (auth.currentUser) {
      try {
        await set(ref(db, `users/${auth.currentUser.uid}/restrictions`), r);
        console.log('スタート制限をクラウドに保存しました', r);
      } catch (e) {
        console.log('スタート制限のクラウド保存に失敗しました', e);
      }
    } else {
      console.log('未ログインのためローカルにのみ保存しました', r);
    }
    window.location.href = 'index.html';
  });
}

// --- account.html: Firebase Authentication でログイン ---
const loginBtn = document.getElementById('login');
if (loginBtn) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const signupBtn = document.getElementById('signup');
  const logoutBtn = document.getElementById('logout');
  const statusEl = document.getElementById('auth-status');

  // ログイン状態の変化を監視して表示を更新する
  onAuthStateChanged(auth, (user) => {
    if (user) {
      statusEl.textContent = `ログイン中: ${user.email}`;
      // Realtime Database にユーザー情報を記録（連携の動作確認用）
      set(ref(db, `users/${user.uid}/lastLogin`), Date.now())
        .then(() => console.log('lastLogin をクラウドに保存しました'))
        .catch((e) => console.log('lastLogin のクラウド保存に失敗しました', e));
    } else {
      statusEl.textContent = '未ログイン';
    }
  });

  loginBtn.addEventListener('click', async () => {
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    } catch (e) {
      statusEl.textContent = `エラー: ${e.message}`;
    }
  });

  signupBtn.addEventListener('click', async () => {
    try {
      await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    } catch (e) {
      statusEl.textContent = `エラー: ${e.message}`;
    }
  });

  logoutBtn.addEventListener('click', () => signOut(auth));
}

// 20-20-20ルールの通知は、遊びタイマー稼働中に runActiveTimer 内で行う
// （経過20分ごと。設定 notify20 がONのときのみ）。

// 全ページ共通: ログイン中はクラウドのスタート制限設定を localStorage に同期しておく。
// これでどの画面にいても最新の設定でスタート可否を判定できる（端末間でも共有される）。
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  onValue(ref(db, `users/${user.uid}/restrictions`), (snap) => {
    const cloud = snap.val();
    if (cloud) localStorage.setItem(RESTRICTIONS_KEY, JSON.stringify(cloud));
  });
});

// --- 共通: 戻る ---
const back = document.getElementById('back');
if (back) {
  back.addEventListener('click', () => {
    console.log('back');
    window.location.href = 'index.html';
  });
}
