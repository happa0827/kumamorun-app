# リポジトリの作り直し（履歴のない公開リポジトリへ）

> v3.0.0 で行った作業の記録。このリポジトリは、この手順で作り直した後のもの。
> 以下の「今のリポジトリ」「古いリポジトリ」は、作り直す前の `kumamorun-app`（今の `kumamorun-app-archive`、非公開）のこと。

## 実施の記録

2026-11-24 に、手順 1〜7 の主なところを行った。

- 済み
  - 手順 1: 履歴のない1コミット `059099e`（版 3.0.0、使っていないアイコンを除いた）。
  - 手順 2: v2.7.0 の下書きを消した（タグはアーカイブに残る）。フォークは0。
  - 手順 2b: 最初の鍵のパスワードが分からなかったため、鍵を入れ替えた（`docs/release.md` の「鍵の入れ替え」）。v3.0.0 は古いリポジトリの Actions で古い鍵（`D6BD73E190E6274A`）で署名し、中には新しい公開鍵（`D6BDAA2685935829`）を入れた。
  - 手順 3: `kumamorun-app-archive` に改名して非公開にした（直前のフォークも0）。
  - 手順 4: 同じ名前で公開リポジトリを作り、`main` を載せた。Release のワークフローは手順 6 の間だけ止めた。
  - 手順 5: 変数 `KUMAMORUN_API_BASE` と、Secrets 4つ（新しい鍵）を入れた。
  - 手順 6: 手順 2b の成果物を載せて v3.0.0 を公開した（Latest）。
  - 手順 7: 配信元の `latest.json` が 3.0.0 を返し、インストーラーが古いリポジトリで作ったものとバイト単位で一致した。アーカイブは非公開。
  - 手順 8: 古いクローン（`kumamorun-tauri`、`kumamorun-app`）の `origin` をアーカイブに向けた。手元だけの `.claude/` と `.env` を新しいクローンに写した。
- 残り
  - v2.6.5 の端末から、アプリ内の更新で v3.0.0 に上がることを確かめる（D7）。D1〜D6 と D8 も。
  - 手元のフォルダーの入れ替え（`kumamorun-tauri` → `kumamorun-tauri-archive`、`kumamorun-fresh` → `kumamorun-tauri`）。作業中のセッションがフォルダーを使っていて、その場では入れ替えられなかった。
  - `CLAUDE_CODE_OAUTH_TOKEN` を入れる（Claude Review 用。`claude setup-token`）。
  - CodeRabbit の GitHub App を、このリポジトリに入れる（選んだリポジトリだけの設定なら）。
  - サイト（kumamorun-projects）の文書の、古いリポジトリを指すリンクを直す。
  - **v3.0.1 は、利用者が全員 v3.0.0 以上になってから出す。**

完全版のキャラクター画像は、今のリポジトリ（`happa0827/kumamorun-app`）のあちこちに残っている。
git の履歴、タグの「Source code (zip)」、過去の PR の参照（`refs/pull/*`。自分では消せない）、v1.0.0〜v2.6.5 のインストーラー、`electron` ブランチ。
履歴を書き換えても PR の参照が残るので、書き換えはしない。代わりに、次のように作り直す。

- 今のリポジトリを `kumamorun-app-archive` に改名し、**非公開**にする。履歴、PR、古いリリースはそこに残る。
- 同じ名前 `kumamorun-app` で**新しい公開リポジトリ**を作り、今のコードを履歴なしの1コミットで載せる。

背景は [ADR 0003](../adr/0003-demo-edition.md)、デモ版の全体は [demo-edition.md](demo-edition.md)。

## なぜ同じ名前にするか

自動更新の配信元は `https://github.com/happa0827/kumamorun-app/releases/latest/download/latest.json`（`tauri.conf.json`）。
名前を引き継げば、この URL が新しいリポジトリを指す。v2.6.5 までの利用者も、新しいリポジトリの最初のリリースへ**そのまま自動で更新される**。
配信元を変えた版を先に配る必要がない。

GitHub は、改名したリポジトリの古い名前を新しい名前へ転送する。ただし、古い名前で新しいリポジトリを作ると、その転送は消えて新しいリポジトリが優先される。この手順はそれを使う。

## 前提（始める前にそろえる）

- [x] サイト（kumamorun-projects）が本番に出ている（2026-11-23）。
- [x] 画像を公開してから1分以上たっていて、`/sync` が `"edition": "full"` と版を返し、`GET /characters/stage0?v=<版>` が PNG を返す（[demo-edition.md](demo-edition.md) の「公開の手順」2〜3）。
  2026-11-23 に、既存のアカウントで確かめた。版 `2026-11-23T05.28.55.502Z-8c10dca0ae27`、10枚とも `200 image/png` で、大きさは元の画像と一致。
  確かめ方: サイトにログインしたブラウザーのコンソールで `fetch('/api/login-code', { method: 'POST' }).then(r => r.json()).then(j => console.log(j.url))` を実行して使い捨てのコードを出し（「アプリを開く」は押さない。アプリがコードを使い切るため）、
  `/exchange` で確認用のトークンに換えて `/sync` と `/characters/{key}?v=` を読み、最後に `/logout` で失効させる。
- [x] PR #17（デモ版）が `main` にマージ済み（2026-11-23、`b915956`）。
- [x] 作り直しを先にする、と決めた（2026-11-23）。新しいリポジトリの最初のリリースは、区切りとして **v3.0.0** にする。
  古いリポジトリの v2.7.0（タグは push 済み、リリースは下書きのまま）は**公開しない**。下書きは手順 2 で消し、タグはアーカイブに残す。
- [x] 残っている PR とブランチを片付けた（2026-11-23）。新しいリポジトリには、`main` の1コミットしか持っていかない。
  - PR #16（README の PR の説明）: マージ済み。PR #15・#17 のブランチと一緒に消した。
  - `happa0827/cloud-failures`: `main` にない1コミット（「fix: サーバーを正とする」）があるが、**そのまま残す**と決めた。
    新しいリポジトリには持っていかないので、アーカイブ（非公開）にだけ残る。後で使うなら、アーカイブから取り出して新しいリポジトリに PR を出す。
  - `electron` ブランチ: 持っていかない（アーカイブにだけ残る）。
  - この手順書の PR（#18）は、作り直しの前にマージしておく（手順書が新しいリポジトリに載る）。
- [x] 署名の鍵と証明書がそろっている。新しいリポジトリの Secrets に入れ直すため（GitHub の Secrets は中身を読み出せない）。
  - コード署名の証明書（pfx）とそのパスワード（auto-clicker と同じもの）。2026-11-24 に `certutil -dump` で開けることを確かめた。
  - 更新用の署名鍵: **最初の鍵（`kumamorun-updater.key`）のパスワードが分からなかった**（2026-11-24）。
    そこで新しい鍵 `kumamorun-updater-v3.key` を作り、v3.0.0 を橋渡しにして入れ替える（下の「鍵の入れ替え」と、`docs/release.md` の「鍵の入れ替え」）。
  - `CLAUDE_CODE_OAUTH_TOKEN`（Claude Review 用。v3.0.0 のリリースには要らない。後で `claude setup-token` で作り直す）。
- [x] 元の画像（`src/assets/evo/`）を、手元の非公開の場所に控えた（2026-11-23 に確認。アーカイブからも取り出せる）。
- [ ] 利用者に、短い間だけ更新が届かない時間があることを伝えるか決めた（下の手順 3〜6 の間。数十分ほど）。

## 手順

上から順に行う。**3 から 6 は間を空けずに続けて行う**（3 の後、6 で最初のリリースを公開するまで、利用者の更新確認は失敗する。アプリは失敗を無視するので、壊れはしない）。

### 1. 載せる中身を作る（手元、まだ何も公開しない）

- [ ] 新しいフォルダーに `main` をクローンする。古いリポジトリのタグ（`v2.7.0` など）を持ってこないよう、`--no-tags` を付ける。
  ```
  git clone --no-tags --single-branch --branch main git@github.com:happa0827/kumamorun-app.git kumamorun-fresh
  cd kumamorun-fresh
  ```
- [ ] 版を 3.0.0 にする（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`Cargo.lock` をそろえる）。
  ```
  bun run bump 3.0.0
  ```
- [ ] 使っていないアイコンを消す。どれもキャラクターを大きく描いたもので、`tauri.conf.json` の `bundle.icon` は使っていない。
  `src-tauri/icons/icon.png`、`Square*Logo.png`、`StoreLogo.png`、`64x64.png`。
  使っているのは `32x32.png`、`128x128.png`、`128x128@2x.png`、`icon.icns`、`icon.ico` だけ。
- [ ] `bun install`、`bunx tsc --noEmit`、`bun test`、`cargo test --lib --manifest-path src-tauri/Cargo.toml` が通る。
- [ ] `bun tauri build` が通る（アイコンを消しても組めることの確かめ。ここで作ったインストーラーは配らない）。
  `tauri.conf.json` は更新用の成果物を作る設定（`createUpdaterArtifacts`）で公開鍵もあるので、署名鍵が無いとビルドが止まる。先に、手元の鍵とパスワードを環境変数に入れる（Git Bash の例）。
  ```
  export TAURI_SIGNING_PRIVATE_KEY="$(cat C:/Users/<ユーザー名>/.tauri/kumamorun-updater.key)"
  read -rs TAURI_SIGNING_PRIVATE_KEY_PASSWORD && export TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  bun tauri build
  ```
  パスワードは `read -s` で入れ、コマンドの履歴や文書に残さない。コード署名の証明書（`certificateThumbprint`）が手元の証明書ストアに無ければ、その段階で止まることがある。そのときは、そこまで（アプリ本体のビルド）が通れば十分とする。
- [ ] 文書の、古いリポジトリを前提にした箇所を直す。
  - `docs/plan/demo-edition.md`: 「`git show b973feb:…`」は `kumamorun-app-archive` で行う、と書き直す。
  - `README.md`: Electron 版は `electron` ブランチではなく、`kumamorun-app-archive`（非公開）の `electron` ブランチにある、と書き直す。
  - この手順書: 「済んだこと」として残すか、消す。
- [ ] 履歴のない1コミットにする。
  ```
  git checkout --orphan fresh
  git add -A
  git commit -m "Kumamorun v3.0.0（以前の履歴は kumamorun-app-archive）"
  ```
- [ ] 画像が入っていないことを確かめる。出てくるのは、シルエット6枚、`kuma-ru.png`、使っているアイコン5つだけのはず。
  ```
  git ls-files | grep -iE '\.(png|jpe?g|gif|webp|ico|icns|svg)$'
  git log --oneline   # 1行だけ
  git tag             # 何も出ない
  ```

### 2. 古いリポジトリの設定を控える

- [ ] リポジトリ変数 `KUMAMORUN_API_BASE` の値を控える（変数は読み出せる: `gh variable list -R happa0827/kumamorun-app`）。
- [ ] Secrets の名前を控える: `CLAUDE_CODE_OAUTH_TOKEN`、`TAURI_SIGNING_PRIVATE_KEY`、`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`、`WINDOWS_CERTIFICATE`、`WINDOWS_CERTIFICATE_PASSWORD`。
- [ ] CodeRabbit の GitHub App が、どのリポジトリに入っているか（すべてか、選んだものだけか）を確かめる。
- [ ] ブランチの保護とルールセットは、今は無い（確認済み）。
- [ ] 公開のフォークが0であることを確かめる（2026-11-23 の時点で0）。フォークがあると、元のリポジトリを非公開にしても、フォークは画像の履歴ごと公開のまま残る。
  ```
  gh api repos/happa0827/kumamorun-app --jq .forks_count
  ```
  0でなければ、ここで止めて、フォークの持ち主に削除を頼むかを決める。
- [ ] v2.7.0 の下書きのリリースを消す（公開しないため。タグ `v2.7.0` は消さず、アーカイブに残す）。
  ```
  gh release delete v2.7.0 -R happa0827/kumamorun-app --yes
  ```
  Latest が v2.6.5 のままであることを確かめる。

### 2b. v3.0.0 を、古いリポジトリで古い鍵を使ってビルドする（鍵の入れ替え）

最初の鍵のパスワードが分からなくなったため、足した手順。古い鍵とパスワードは、古いリポジトリの Secrets にしか無い。
v2.6.5 までの端末が v3.0.0 を受け付けるよう、v3.0.0 は**古い鍵で署名**する（中には新しい公開鍵が入っている。`docs/release.md` の「鍵の入れ替え」）。
改名と非公開化の**前に**行う（非公開でも Actions は動くが、無料枠の消費が増える）。

- [ ] 新しい鍵とパスワードが組になっていることを確かめる（手元の `kumamorun-fresh` の `tauri.conf.json` は、新しい公開鍵）。
  ```
  bash check-updater-key.sh C:/Users/<ユーザー名>/.tauri/kumamorun-updater-v3.key
  ```
- [ ] `fresh` の1コミットを、古いリポジトリにタグ `v3.0.0` として push する（ブランチは作らない）。このコミットには画像が無いので、公開中のリポジトリに置いてよい。
  ```
  git tag v3.0.0
  git push origin v3.0.0
  ```
- [ ] 古いリポジトリの Actions（Release）が通り、v3.0.0 の**下書き**ができる。成果物は `Kumamorun_3.0.0_x64-setup.exe`、`.sig`、`latest.json`。
  `latest.json` の `url` は `https://github.com/happa0827/kumamorun-app/releases/download/v3.0.0/Kumamorun_3.0.0_x64-setup.exe`。改名した後は、この URL が新しいリポジトリを指す。
- [ ] 下書きの3つを手元に落とす。**下書きは公開しない**（古いリポジトリの Latest は v2.6.5 のまま）。
  ```
  gh release download v3.0.0 -R happa0827/kumamorun-app -D <置き場所>
  ```
- [ ] `.sig` が古い鍵（鍵 ID `D6BD73E190E6274A`）の署名であること。v2.6.5 の端末は、この鍵の署名しか受け付けない。

### 3. 古いリポジトリを改名して、非公開にする

- [ ] Settings → General → Repository name を `kumamorun-app-archive` にする。
- [ ] **非公開にする直前に、もう一度**フォークが0であることを確かめる（手順 2 の確認の後に、誰かがフォークしたかもしれないため）。
  ```
  gh api repos/happa0827/kumamorun-app-archive --jq .forks_count
  ```
  この確認から非公開にするまでの、ごく短い間にフォークされる心配は消せない。0を確かめたら、すぐに次へ進む。
- [ ] Settings → General → Danger Zone → Change visibility で **Private** にする。
- [ ] `gh repo view happa0827/kumamorun-app-archive --json visibility` が `PRIVATE`。

### 4. 同じ名前で新しい公開リポジトリを作り、載せる

- [ ] `gh repo create happa0827/kumamorun-app --public`（README などは作らない）。
- [ ] 手順 1 の `fresh` を `main` として載せる。**タグは載せない**（`--tags` を付けない）。
  ```
  git remote set-url origin git@github.com:happa0827/kumamorun-app.git
  git push origin fresh:main
  ```
- [ ] 既定のブランチが `main`。
- [ ] Release のワークフローを止めておく（手順 6 でタグ `v3.0.0` を作ると、新しいリポジトリでもビルドが始まってしまうため）。
  ```
  gh workflow disable release.yml -R happa0827/kumamorun-app
  ```

### 5. 新しいリポジトリの設定を作り直す

- [ ] 変数 `KUMAMORUN_API_BASE`（手順 2 で控えた値）。
- [ ] Secrets 4つ（`docs/release.md` の「GitHub の Secrets」）。更新用の鍵は**新しい鍵**（`kumamorun-updater-v3.key`）とそのパスワード。v3.0.1 から使う。
- [ ] CodeRabbit の GitHub App を、このリポジトリにも入れる（選んだリポジトリだけの設定なら）。
- [ ] Actions が有効（新しいリポジトリでは既定で有効）。

### 6. 最初のリリースを出す

- [ ] 版が 3.0.0 になっている（手順 1 で上げ済み）。
- [ ] 手順 2b で落とした3つを載せて、v3.0.0 の**下書き**を作る。タグは `main`（手順 2b と同じコミット）に付く。
  ```
  gh release create v3.0.0 -R happa0827/kumamorun-app --target main --draft --title "Kumamorun v3.0.0" \
    <置き場所>/Kumamorun_3.0.0_x64-setup.exe <置き場所>/Kumamorun_3.0.0_x64-setup.exe.sig <置き場所>/latest.json
  ```
- [ ] 下書きのインストーラーを入れて、`docs/acceptance.md` の D1〜D8 を確かめる。
- [ ] 下書きを公開する。**Latest になっていること。**
- [ ] Release のワークフローを有効に戻す（`gh workflow enable release.yml -R happa0827/kumamorun-app`）。v3.0.1 からは、タグの push で新しい鍵の署名つきのリリースができる。
  **v3.0.1 は、利用者が全員 v3.0.0 以上になってから出す**（`docs/release.md` の「鍵の入れ替え」）。

### 7. 確かめる

- [ ] 配信元の URL が、新しいリポジトリの v3.0.0 を返す。
  ```
  curl -sL https://github.com/happa0827/kumamorun-app/releases/latest/download/latest.json
  ```
  `version` が `3.0.0`、`url` が新しいリポジトリのインストーラーを指す。
- [ ] v2.6.5 を入れた端末で、アプリ内の更新通知が出て、v3.0.0 に更新できる。更新後もログインしたままで、完全版の画像が出る（D7）。
- [ ] ログインしていないブラウザーで、`https://github.com/happa0827/kumamorun-app-archive` が 404（非公開）。
- [ ] 新しいリポジトリに、タグは `v3.0.0` だけ、リリースも v3.0.0 だけ。

### 8. 後片付け

- [ ] 手元のクローンを入れ替える。今の `C:\dev\kumamorun\kumamorun-tauri` の `origin` は、同じ URL で新しいリポジトリを指すが、履歴がつながっていないので push できない。
  - 新しいリポジトリをクローンし直して、そちらで作業する。
  - 古いクローンは、`origin` を `kumamorun-app-archive` に向けて残すか、消す。
  - `C:\dev\kumamorun\kumamorun-app`（Electron 版のクローン）も同じ URL を向いている。`kumamorun-app-archive` に向け直すか、消す。
- [ ] サイト（kumamorun-projects）の文書で、このリポジトリの PR やコミットを指すリンク（`git show …` など）を、アーカイブを前提に直す。
- [ ] `docs/plan/demo-edition.md` と ADR 0003 の「守れないもの」を、作り直した後の状態に合わせて直す。新しいリポジトリには画像の履歴はなく、残るのはアーカイブ（非公開）と、配布済みのインストーラーだけになる。

## 戻し方

手順 3〜5 の途中で止めるとき（最初のリリースを公開する前）:

1. 新しいリポジトリを消すか、別の名前に改名する。
2. `kumamorun-app-archive` を `kumamorun-app` に戻し、Public に戻す。
3. 配信元の URL が、また v2.6.5 を返すことを確かめる。

手順 2 で消した v2.7.0 の下書きのリリースは、戻しても復元されない（`gh release delete` は元に戻せない）。
タグ `v2.7.0` は残しているので、要るなら古いリポジトリの Actions で、v2.7.0 の Release の実行を Re-run すれば下書きを作り直せる
（Release のワークフローはタグの push でしか始まらないので、新しく流すのではなく、前の実行をやり直す: `gh run rerun <実行の ID> -R happa0827/kumamorun-app`。ID は `gh run list --workflow release.yml` で分かる）。
Re-run できるのは、実行から30日以内だけ。v2.7.0 の実行は 2026-11-23 なので、**2026-12-23 ごろまで**。
それを過ぎたら、タグ `v2.7.0` を GitHub から消して、同じコミットに付け直して push すれば、ワークフローが新しく走って下書きができる。

v3.0.0 を公開した後は戻さない。利用者が新しいリポジトリのリリースへ更新し始めているため。

## 守れないもの（作り直した後も）

- これまでに配ったインストーラー（v1.0.0〜v2.6.5）と、誰かが手元に持っているクローン。
- 公開のフォーク（作り直す時点で0なら、この心配はない。手順 2 で確かめる）。
- アプリのアイコン（32px と 128px と 256px）。インストーラーとタスクバーに出るので外せない。
- 承認された端末に置かれる画像。
