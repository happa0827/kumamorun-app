# Kumamorun

遊びと休憩の区切りを守ると、キャラクターが育つ休憩習慣タイマー。Windows 専用の Tauri 2 アプリ。
用語は [GLOSSARY.md](GLOSSARY.md) に従う。

以前の Electron 版は `electron` ブランチ（v1.x のタグ）に残してある。

## 構成

- **Rust**: ドメイン（タイマー、スタート制限、失敗と進化の判定）、ローカルの JSON 保存、音と読み上げ、
  トーストのカーソル監視、トレイ、OS 依存のコード。タイマーは画面を切り替えても止まらない。
- **WebView（React + TypeScript）**: 表示と入力だけ。Firebase の JS SDK もここにある。
- **Firebase**: `users/{uid}` と `liveStatus` の形は固定。status-kumamorun が読む。

この分け方の理由は [docs/adr/0001-rust-domain-webview-firebase.md](docs/adr/0001-rust-domain-webview-firebase.md)。

## 開発の始め方

必要なもの: Bun、Rust（`mise.toml` を参照）、WebView2。

```
bun install
bun run tauri dev
```

開発ビルドは、開発用アカウントでだけ動く。リポジトリのルートに `.env` を作る（コミットしない。`.gitignore` 済み）。

```
VITE_DEV_EMAIL=...
VITE_DEV_PASSWORD=...
```

本番ビルドには、この値は含まれない。

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
