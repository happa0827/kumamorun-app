const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// --- コード署名（このPCだけで有効な自己署名証明書）---
// 秘密鍵はパスワード付きの kumamorun.pfx に保管し、そこから署名する。
// パスワードは .env の CERTIFICATE_PASSWORD から読む（.pfx も .env も .gitignore 済み）。
//
// ※ .env を自動で読み込むのは bun だけ。必ず `bun run make` / `bun run publish` で実行すること。
//   `npm run make` や `electron-forge make` の直叩きでは未設定になる。
// ※ signtool の `/fd` は @electron/windows-sign が hashes から自動で付けるので、
//   signWithParams などで自分で書いてはいけない（"You cannot use the /fd option twice." になる）。
const certificatePassword = process.env.CERTIFICATE_PASSWORD;
if (!certificatePassword) {
  console.warn(
    '[forge] CERTIFICATE_PASSWORD が未設定です。署名に失敗します（`bun run make` で実行してください）',
  );
}

const windowsSign = {
  certificateFile: './kumamorun.pfx',
  certificatePassword,
  // 既定は [sha1, sha256] の二重署名。今どき sha1 は不要なので sha256 だけにする
  hashes: ['sha256'],
};

module.exports = {
  packagerConfig: {
    asar: true,
    // 実行ファイル/アプリのアイコン（拡張子なし＝OSごとに .ico/.icns を自動選択）
    icon: './src/icon',
    // アプリ本体（Kumamorun.exe）の署名。maker 側の設定は Setup.exe にしか効かないため、
    // 本体を署名するにはこちらが別途必要。
    windowsSign,
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'happa0827',
          name: 'kumamorun-app',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // インストーラー（Setup.exe）のアイコン
        setupIcon: './src/icon.ico',
        // インストーラー（Setup.exe）の署名。
        // ここで `signWithParams` を直接渡すと Squirrel へ素通しする旧経路に入り、
        // packagerConfig 側と書き方が変わってしまうので windowsSign 経由で揃える。
        windowsSign,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
