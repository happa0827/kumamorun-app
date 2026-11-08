# Void + Cloudflare + D1 への移行計画

別エージェントが Void のプロジェクト（サイトと API）を作るための計画書。判断の理由は [ADR 0002](../adr/0002-void-d1-replaces-firebase.md)、用語は [GLOSSARY.md](../../GLOSSARY.md)（アカウント、端末、ライブ状況）に従う。

## 分担

| 担当 | 範囲 |
|---|---|
| 別エージェント（新しいリポジトリ） | 段階 0、1、状況ページ |
| このリポジトリ（kumamorun-tauri） | 段階 2、3、5 |
| 共同 | 段階 4（切り替え日） |

アプリとサイトの約束は、この文書の「API」と「スキーマ」。変えるときは、両方のリポジトリで同時に直す。

## 決定の一覧

- 構成: Void（Cloudflare Workers）+ D1。サイト、認証、アプリ向け API、状況ページを1つのプロジェクトに置く。
- 認証: メールとパスワード、OAuth（Google など）、パスキー。Void の Better Auth を使う。パスキーが Void 経由で使えなければ、プラグインを自分で配線し、それも難しければ後回しにする。
- ディープリンク: サイトが短時間だけ有効な使い捨てコードを `kumamorun://auth?code=…` で渡す。アプリが API で端末のトークンに交換する。トークンは URL に載せない。
- 端末のトークン: 端末ごとに発行し、サイトの画面から失効できる。アプリは Rust 側で OS の資格情報ストアに保管し、WebView には渡さない。
- 切断の検知: ハートビート。アプリは20秒ごとにライブ状況を書く。サイトは最後の書き込みから60秒を超えたら停止とみなす。正常終了とログアウトでは、アプリが明示的にオフラインを書く。必要になれば後から Durable Objects で1秒級にする。
- 表示: 状況ページは10秒ポーリング。
- 進化: ルール（成長か開花か）は Rust が決める。サーバーは不変条件の検査と、段階と花の原子的な書き込みだけを行う。
- 同期: WebView ではなく Rust の HTTP クライアントが行う。
- オフライン: 記録、進化の保留、設定は Rust 側のキューにため、つながったら順に送る。ライブ状況は最新の1件だけを送る。進化はキューにためず、つながってから判定し直す。
- 環境: 開発はローカルの `void dev`（ローカルの D1）だけ。デプロイするのは本番の1つ。アプリの開発ビルドは `http://localhost` の API につなぐ。OAuth の戻り先には、本番とローカルの両方を登録する。
- 移行: 二重書き込みなし。利用者は数人。新しい版の初回ログインで、端末のローカルデータを自動で取り込む。最後の Firebase 版には書き出し機能（保険）を足す。

## スキーマ（D1）

認証のテーブル（ユーザー、セッション、パスキー、OAuth など）は Void が作る。以下は私たちが足す分。`account_id` は Void が持つユーザーの ID を指す。

```sql
-- 端末ごとのトークン。トークンそのものではなくハッシュを保存する。
CREATE TABLE devices (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL,
  name        TEXT NOT NULL,            -- 例: "DESKTOP-ABC"
  token_hash  TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at  INTEGER                   -- 失効したら入る
);

-- ディープリンクの使い捨てコード。短時間で失効し、一度しか使えない。
CREATE TABLE login_codes (
  code_hash   TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  used_at     INTEGER
);

-- スタート制限。形の検証はアプリ（Rust）が行うので JSON のまま持つ。
CREATE TABLE settings (
  account_id        TEXT PRIMARY KEY,
  restrictions_json TEXT NOT NULL,
  updated_at        INTEGER NOT NULL
);

-- 当日の記録と直近7日の履歴。日付ごとの行。
CREATE TABLE daily (
  account_id TEXT NOT NULL,
  date       TEXT NOT NULL,             -- "YYYY-MM-DD"
  plays      INTEGER NOT NULL,
  failures   INTEGER NOT NULL,
  PRIMARY KEY (account_id, date)
);

-- 進化段階（0〜5）と花の数。
CREATE TABLE progress (
  account_id TEXT PRIMARY KEY,
  stage      INTEGER NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 5),
  flowers    INTEGER NOT NULL DEFAULT 0 CHECK (flowers >= 0),
  updated_at INTEGER NOT NULL
);

-- ライブ状況。アカウントにつき1行。
CREATE TABLE live_status (
  account_id TEXT PRIMARY KEY,
  app_running INTEGER NOT NULL,
  body_json   TEXT NOT NULL,            -- 下の「ライブ状況の形」
  updated_at  INTEGER NOT NULL          -- サーバーが入れる時刻
);
```

### ライブ状況の形

今の `liveStatus` のキーを引き継ぐ。`body_json` に入れる。

```
keeping, phase, label, remainingSec, startedAt, duration, running,
startBlocked, blockReason, daily, week
```

`phase` は `lunch | play | break | paused | reward | finished | ended | idle | offline`。`appRunning` と停止の判定は、`app_running` と `updated_at` から**サーバーが**決める（`now - updated_at > 60秒` なら停止）。

## API

すべて `/api/app/v1/…`。認証は `Authorization: Bearer <端末のトークン>`（`/exchange` を除く）。時刻はサーバーの時刻を正とする。

| メソッドと経路 | 内容 |
|---|---|
| `POST /exchange` | `{ code, deviceName }` を受け、`{ token }` を返す。コードは一度しか使えない。 |
| `POST /logout` | この端末のトークンを失効する。 |
| `GET /sync` | 設定、直近7日の記録、進化段階、花の数をまとめて返す。 |
| `PUT /settings` | `{ restrictions }` を保存する。 |
| `PUT /days` | `{ daily, history }` を保存する。 |
| `POST /evolve` | `{ expectedStage, nextStage, flowersToAdd }`。下記。 |
| `PUT /live-status` | ライブ状況を書く。`updated_at` はサーバーが入れる。 |
| `POST /live-status/offline` | 正常終了とログアウトで、オフラインを明示する。 |
| `POST /import` | 初回ログインで、ローカルのデータ（記録、進化、花、設定）を取り込む。空のアカウントにだけ書く。 |

### 進化

サーバーは現在の `stage` が `expectedStage` と一致するときだけ、次の不変条件を確かめ、段階と花を**1つのトランザクション**で書く。

- 成長: `nextStage = expectedStage + 1`、`flowersToAdd = 0`
- 開花: `expectedStage = 5`、`nextStage = 0`、`flowersToAdd = 1`

一致しなければ `409` を返し、現在の値を添える。アプリは、読み直して判定し直す。

### エラー

| 状態 | 意味 | アプリの動き |
|---|---|---|
| `401` | トークンが無効、または失効 | 再ログインを促す |
| `409` | 比較書き込みの衝突 | 読み直して判定し直す |
| `422` | 不変条件の違反、形が不正 | 再試行しない。ログに残す |
| `429`、`5xx` | 混雑、障害 | 間隔を延ばして再試行する |

## 段階

### 段階 0: 検証（別エージェント）

小さな Void プロジェクトで次を確かめ、本実装に進むかを決める。

- [ ] `void init` から `void deploy` まで通り、D1 が作られる
- [ ] メールとパスワードでの登録とログイン
- [ ] OAuth（Google など）でのログイン。ローカルと本番の戻り先を登録できる
- [ ] パスキーでの登録とログイン（無理なら、プラグインの配線か後回しかを報告する）
- [ ] ディープリンクの使い捨てコード交換（`/exchange`）が成立する
- [ ] `batch()` による、段階と花を1つにした更新が原子的に動く

結果は報告し、**パスキーの扱い**と、Void のまま進めるかを決める。使えなければ Next.js + Vercel + Neon に切り替える（ADR 0002）。

### 段階 1: サイト、認証、D1、API（別エージェント）

- 上のスキーマとマイグレーション
- 認証画面（登録、ログイン、パスキー、OAuth）
- 端末の一覧と失効の画面
- ディープリンクの発行（ログイン後に「アプリを開く」）
- 上の API のすべて
- 状況ページ（ライブ状況を10秒ごとに取得して表示）。**表示の仕様は、今の `status-kumamorun` の場所が分かってから足す。**

### 段階 2: アプリの Rust 同期とディープリンク（このリポジトリ）

実装は `src-tauri/src/cloud/`（`http.rs`、`wire.rs`、`evolution.rs`、`live.rs`、`link.rs`、`token.rs`、`worker.rs`）。

- [x] `kumamorun://auth` のディープリンクを受ける（`tauri-plugin-deep-link`、`tauri.conf.json` に scheme）
- [x] トークンを OS の資格情報ストアに保管する（接続先ごとに別の項目）
- [x] Rust の HTTP クライアントで `/exchange`、`/sync`、`/settings`、`/days`、`/evolve`、`/live-status`、`/import`、`/logout` を呼ぶ
- [x] 失敗の分類と、間隔を延ばす再試行（2秒から倍々、5分で頭打ち）。記録と設定は、端末の状態から毎回作り直すので、キューは「変更あり」の印と再試行で足りる
- [x] 初回ログインで、まっさらなアカウントなら、ローカルのデータ（記録、設定、`Saved.progress` の控え）を `/import` で取り込む。控えが無ければ、進化段階 0、花 0 から。旧版の `evolution = 6` は 5 に丸める
- [x] 進化の反映は、`409` の「今の値」で判定し直す（最大3回）。失敗した分は保留に戻す
- [x] WebView の Firebase 関連を外し、`firebase` を依存から外す。画面は Rust が流す `cloud` イベントを見るだけ
- [x] 開発ビルドは `http://localhost:5173` の API につなぐ。リリースビルドは、変数 `KUMAMORUN_API_BASE` を埋め込む
- [x] アプリの終了時に、サイトを「停止」にする（`RunEvent::Exit`）
- [x] 通しテスト（ローカルの `void dev` に対し、全 API を呼ぶ。`cargo test --lib 実サーバー -- --ignored`）
- [ ] **実機の確認**: ブラウザーでログイン → 「アプリを開く」でアプリに戻る → 状況ページに反映、までを Windows の release ビルド（インストーラー経由）で確かめる
- [ ] 変数 `KUMAMORUN_API_BASE` に本番の URL を設定する

### 段階 3: 最後の Firebase 版（このリポジトリ）

**段階 2 より先に作って配布する。** 段階 2 で Firebase のコードを消すため、Firebase から読む処理は、この版が最後になる。

進化段階と花の数は、端末の保存（`state.json`）に無く、クラウドだけが持っていた。そのため、初回ログインのローカル取り込みでは運べない。この版で次を足す。

- [x] 進化段階と花の数が Firebase から読めたら、端末の保存に控える（`Saved.progress`、`mirror_progress`）。控えのない古いファイルも読める
- [x] データの書き出し（保険）。設定画面の「書き出す」で、ダウンロードフォルダーに `kumamorun-backup-YYYY-MM-DD.json` を書く。保存ファイルと同じ形で、控えも含む
- [ ] 切り替え日をアプリとサイトで案内する。「それまでに、最新版を一度起動してください」（**日付が決まってから**）

利用者がこの版を起動していないと、控えが無く、進化段階と花の数が引き継げない。切り替え日の前に、全員が一度起動したことを確かめる。起動できなかった人は、書き出しファイルか手入力で補う。

### 段階 4: 切り替え日（共同）

1. Void のサイトと API を本番に出す。
2. 新しいアプリ版を配布する。
3. 利用者が新しく登録し、初回ログインでローカルのデータを取り込む。
4. 旧版は、Firebase に書けなくなっても、ローカルのタイマーは動き続ける。

### 段階 5: 後片付け（このリポジトリ）

- Firebase を読み取り専用にし、取り込みの確認後に削除する
- Electron 版（`kumamorun-app`）の整理
- `docs/acceptance.md`、`README.md` の Firebase の記述を直す

## 受け入れ条件

- 強制終了から60秒以内に、状況ページが停止になる
- 正常終了とログアウトでは、すぐにオフラインになる
- 進化は、二重にも欠落にもならない。段階と花は常に同時に変わる
- ネットワークを切って記録を重ねても、つながった後に失われない
- 端末の失効後、その端末の API 呼び出しは `401` になる
- 開発ビルドが、本番のデータに触れない
- トレイ常駐中も、ライブ状況が20秒ごとに届く（Windows 実機、release ビルド）

## 未決

- `status-kumamorun`（今のサイト）の場所と、新しい状況ページの表示の仕様。サイトができたら足す。
- パスキーを Void 経由で使えるか。段階 0 で決める。
