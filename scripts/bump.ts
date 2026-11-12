/**
 * バージョンを上げる。使い方:
 *   bun run bump                         今の版を表示する
 *   bun run bump patch | minor | major   現在の版から上げる
 *   bun run bump 2.6.0                   版を直接指定する
 *
 * 次の 4 か所を同じ版にそろえる。
 *   package.json / src-tauri/tauri.conf.json / src-tauri/Cargo.toml / src-tauri/Cargo.lock
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function file(path: string) {
  const full = join(root, path);
  return {
    read: () => readFileSync(full, "utf8"),
    write: (text: string) => writeFileSync(full, text),
  };
}

/** `pattern` の最初の 1 件の版だけを置き換える。見つからなければ止める。 */
function replaceVersion(path: string, pattern: RegExp, next: string) {
  const target = file(path);
  const text = target.read();
  if (!pattern.test(text)) fail(`${path}: 版が見つかりません`);
  target.write(text.replace(pattern, `$1${next}$2`));
}

const current = (JSON.parse(file("package.json").read()) as { version: string }).version;
const currentMatch = SEMVER.exec(current);
if (!currentMatch) fail(`package.json の版が x.y.z ではありません: ${current}`);
const [major, minor, patch] = currentMatch.slice(1).map(Number);

const arg = process.argv[2];
// 引数なしなら、今の版を表示するだけ。
if (arg === undefined) {
  console.log(current);
  process.exit(0);
}
let next: string;
if (arg === "major") next = `${major + 1}.0.0`;
else if (arg === "minor") next = `${major}.${minor + 1}.0`;
else if (arg === "patch") next = `${major}.${minor}.${patch + 1}`;
else if (SEMVER.test(arg)) next = arg;
else fail("使い方: bun run bump <patch|minor|major|x.y.z>");

if (next === current) fail(`すでに ${current} です`);

replaceVersion("package.json", /^(\s*"version":\s*")[^"]+(")/m, next);
replaceVersion("src-tauri/tauri.conf.json", /^(\s*"version":\s*")[^"]+(")/m, next);
replaceVersion("src-tauri/Cargo.toml", /^(version\s*=\s*")[^"]+(")/m, next);
// Cargo.lock には他のクレートの版も並ぶので、このアプリの項目だけを狙う。
replaceVersion("src-tauri/Cargo.lock", /(name = "kumamorun-tauri"\r?\nversion = ")[^"]+(")/, next);

console.log(`${current} -> ${next}`);
