import { convertFileSrc } from "@tauri-apps/api/core";
import stage0 from "./assets/silhouette/stage0.png";
import stage1 from "./assets/silhouette/stage1.png";
import stage2 from "./assets/silhouette/stage2.png";
import stage3 from "./assets/silhouette/stage3.png";
import stage4 from "./assets/silhouette/stage4.png";
import stage5 from "./assets/silhouette/stage5.png";
import { characterKey, clampStage } from "./character";
import type { View } from "./types";

/**
 * 成長段階のシルエット。アプリに入れるのはこれだけで、完全版の画像はリポジトリにもアプリにも入れない
 * （承認された端末だけがサーバーから受け取る。docs/adr/0003-demo-edition.md）。
 */
const SILHOUETTES = [stage0, stage1, stage2, stage3, stage4, stage5];

/**
 * 表示するキャラクターの画像。
 * 完全版の画像がそろっていれば（`charactersVersion` がある）Rust の `character://` から、
 * なければ成長段階のシルエット。版を URL に付けて、画像を取り直したら読み直させる。
 */
export function characterImage(
  stage: number | null,
  bloom: View["bloom"],
  charactersVersion: string | null,
): string {
  if (!charactersVersion) return SILHOUETTES[clampStage(stage)];
  const src = convertFileSrc(characterKey(stage, bloom), "character");
  return `${src}?v=${encodeURIComponent(charactersVersion)}`;
}
