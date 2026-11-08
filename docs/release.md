# リリースと切り替えの手順

Windows 専用。インストーラーは NSIS で、GitHub Actions がビルドする。手元のリリースビルドは配布に使わない。

## 一度だけ必要な準備

### 更新用の署名鍵（専用）
アプリ内の更新は、この鍵で署名した成果物だけを受け付ける。他のアプリの鍵は使い回さない。

```
bun tauri signer generate -w C:/Users/<ユーザー名>/.tauri/kumamorun-updater.key
```

- 秘密鍵（`.key`）は手元に置くだけで、リポジトリに入れない。失うと、既存の利用者へ更新を配れなくなる。
- パスワードを付ける。パスワードはチャットや文書に書かず、GitHub の Secrets にだけ入れる。忘れると秘密鍵が使えなくなるので、パスワードマネージャーなどに控える。
- 公開鍵（`.key.pub` の中身）を `src-tauri/tauri.conf.json` の `plugins.updater.pubkey` に入れる。鍵を作り直したら公開鍵も変わる。食い違うと、更新が検証で弾かれる。

### GitHub の Secrets（happa0827/kumamorun-app）
| 名前 | 中身 |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | 秘密鍵ファイルの中身 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 鍵を作ったときのパスワード |
| `WINDOWS_CERTIFICATE` | コード署名の証明書（pfx）を base64 にしたもの |
| `WINDOWS_CERTIFICATE_PASSWORD` | 証明書のパスワード |

証明書は auto-clicker と同じもの（`certificateThumbprint` も同じ）。

## 接続先（サイトの URL）
- リリースビルドの接続先は、GitHub のリポジトリ変数 `KUMAMORUN_API_BASE`（`https://…`）で決める。
  設定は Settings → Secrets and variables → Actions → Variables。
- 未設定だと、リリースのワークフローが最初に止まる（接続先が空のアプリは、ログインできないため）。
- 開発ビルド（`tauri dev`）は、ローカルの `void dev`（`http://localhost:5173`）につながる。
  本番のデータには触れない。
- 端末のトークンは、接続先ごとに別の項目として、OS の資格情報マネージャーに保管される。

## リリース
1. `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` の version をそろえる。
2. main に入れて、タグを付けて push する: `git tag v2.0.1 && git push origin v2.0.1`
3. Actions が、型検査・テストを通したうえでビルドし、GitHub Releases に**下書き**を作る。
4. 下書きのインストーラーを入れて、`docs/acceptance.md` の実機の項目を確かめる。
5. 問題なければ公開する。公開した時点で、アプリ内の更新通知が届く（`latest.json`）。

## Electron 版からの切り替え（手動、1回、並行稼働しない）
1. Electron 版を終了する。トレイにも残らないこと。
2. Electron 版をアンインストールする。
3. Tauri 版のインストーラーを実行する。
4. アカウント画面の「ブラウザーでログイン」から、サイトでログインする（初めてなら登録）。「アプリを開く」でアプリに戻る。
5. 起動時に、Electron 版が最後に記録した日が成功だった場合は、進化が1つ反映される。
6. スタート制限、進化、花、直近の記録が Electron 版と同じであること。
7. トレイの「PC起動時に自動で起動」を、必要なら有効にする。

切り替えるまでは、Tauri 版は開発用アカウントでだけ動かす。本番アカウントのデータには触れない。
