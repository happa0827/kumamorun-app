/**
 * 保留中の進化をクラウドへ反映する手順。
 * 成長か開花かは Rust が決め、ここは「読んだ値のままのときだけ書く」ことで、
 * 別の端末と同時に進めても二重に進まないようにする。
 */

export type FlowerName = "Dandelion" | "Peony" | "BlueSpiderLily" | "NightCherry";

/** Rust が決めた次の一手。開花なら `stage` は null（段階は 0 に戻る）。 */
export interface Plan {
  stage: number | null;
  flower: FlowerName | null;
  gain: number;
}

export interface EvolutionDeps {
  /** 保留から1つ取り出す。無ければ false。 */
  take(): Promise<boolean>;
  /** 反映できなかった分を保留に戻す。 */
  restore(): Promise<void>;
  readStage(): Promise<number>;
  plan(current: number): Promise<Plan>;
  /** 段階が `expected` のままのときだけ `next` に書く。書けたら true。 */
  casStage(expected: number, next: number): Promise<boolean>;
  addFlowers(count: number): Promise<void>;
  /** 反映できたことを Rust に伝える（通知と、今日の花の記録）。 */
  commit(flower: FlowerName | null): Promise<void>;
}

const MAX_ATTEMPTS = 3;

/** 反映できた進化の数を返す。途中で失敗したら、その分を保留に戻して止まる。 */
export async function applyPendingEvolutions(deps: EvolutionDeps): Promise<number> {
  let applied = 0;
  while (await deps.take()) {
    let plan: Plan | null = null;
    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !plan; attempt += 1) {
        const current = await deps.readStage();
        const next = await deps.plan(current);
        const won = await deps.casStage(current, next.stage ?? 0);
        if (won) plan = next;
      }
    } catch (e) {
      console.warn("進化をクラウドに反映できませんでした", e);
    }
    if (!plan) {
      await deps.restore();
      return applied;
    }
    if (plan.flower) await deps.addFlowers(plan.gain).catch((e) => console.warn("花の加算に失敗しました", e));
    await deps.commit(plan.flower);
    applied += 1;
  }
  return applied;
}
