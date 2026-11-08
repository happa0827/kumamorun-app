# Kumamorun

遊びと休憩の区切りを守ると、キャラクターが育つ休憩習慣タイマー。Windows 専用の Tauri 2 アプリ。
用語は [GLOSSARY.md](GLOSSARY.md) に従う。

以前の Electron 版は `electron` ブランチ（v1.x のタグ）に残してある。

## 構成

- **Rust**: ドメイン（タイマー、スタート制限、失敗と進化の判定）、ローカルの JSON 保存、音と読み上げ、
  トーストのカーソル監視、トレイ、OS 依存のコード、クラウドとの同期（`src-tauri/src/cloud/`）。
  タイマーは画面を切り替えても止まらない。
- **WebView（React + TypeScript）**: 表示と入力だけ。
- **クラウド**: Void + Cloudflare + D1（別リポジトリ [kumamorun-projects](https://github.com/happa0827/kumamorun-projects)）。
  ログインはサイトで行い、`kumamorun://auth?code=…` のリンクでアプリに戻る。
  形は [docs/plan/void-migration.md](docs/plan/void-migration.md)。

この分け方の理由は [docs/adr/0002-void-d1-replaces-firebase.md](docs/adr/0002-void-d1-replaces-firebase.md)
（ドメインと音を Rust が持つ理由は [ADR 0001](docs/adr/0001-rust-domain-webview-firebase.md)）。

## 開発の始め方

必要なもの: Bun、Rust（`mise.toml` を参照）、WebView2。

```
bun install
bun run tauri dev
```

開発ビルドは、ローカルの `void dev`（既定は `http://localhost:5173`）につながる。本番のデータには触れない。
別のサーバーにつなぐときは、環境変数 `KUMAMORUN_API_BASE` を使う。

リリースビルドの接続先は、ビルド時に決まる（GitHub のリポジトリ変数 `KUMAMORUN_API_BASE`）。
実行時の環境変数では変えられない。

## テスト

```
bunx tsc --noEmit
bun test
cargo test --lib --manifest-path src-tauri/Cargo.toml
```

Rust のドメインは、時刻を差し替えて自動で確かめる。画面、音、OS の挙動が絡む項目は
[docs/acceptance.md](docs/acceptance.md) の実機チェックで確かめる。

## リリース

`v*` のタグを push すると、Actions が署名付きのインストーラーをビルドして、GitHub Releases に下書きを作る。
公開すると、アプリ内の更新通知が届く。手順は [docs/release.md](docs/release.md)。

`main` への push では CI が走り、テストと Rust のビルドキャッシュ作りを行う。
