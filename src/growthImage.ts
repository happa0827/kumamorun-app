import evo01 from "./assets/evo/01.png";
import evo02 from "./assets/evo/02.png";
import evo03 from "./assets/evo/03.png";
import evo04 from "./assets/evo/04.png";
import evo05 from "./assets/evo/05.png";
import evo06 from "./assets/evo/06.png";
import evo07 from "./assets/evo/07.png";
import evo08 from "./assets/evo/08.png";
import evo09 from "./assets/evo/09.png";
import evo11 from "./assets/evo/11.png";
import type { View } from "./types";

/** 成長段階の画像（0=種子 … 5=つぼみ大きく）。 */
const STAGES = [evo01, evo02, evo03, evo04, evo05, evo06];

const FLOWERS: Record<NonNullable<View["bloom"]>, string> = {
  dandelion: evo07,
  peony: evo08,
  blueSpiderLily: evo09,
  nightCherry: evo11,
};

/** 開花した日はその花、それ以外は成長段階の画像。仕様変更前の段階6以上は最後の画像に丸める。 */
export function characterImage(stage: number | null, bloom: View["bloom"]): string {
  if (bloom) return FLOWERS[bloom];
  return STAGES[Math.min(Math.max(stage ?? 0, 0), STAGES.length - 1)];
}
