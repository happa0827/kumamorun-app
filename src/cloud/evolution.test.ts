import { describe, expect, test } from "bun:test";
import { applyPendingEvolutions, type EvolutionDeps, type Plan } from "./evolution";

/** 手で動かせる偽の Rust とクラウド。呼ばれた順を記録する。 */
function setup(options: {
  pending: number;
  stage?: number;
  plan?: (current: number) => Plan;
  casFailures?: number;
  readError?: boolean;
}) {
  const log: string[] = [];
  let pending = options.pending;
  let stage = options.stage ?? 0;
  let casFailures = options.casFailures ?? 0;
  const deps: EvolutionDeps = {
    take: async () => {
      if (pending === 0) return false;
      pending -= 1;
      log.push("take");
      return true;
    },
    restore: async () => {
      pending += 1;
      log.push("restore");
    },
    readStage: async () => {
      if (options.readError) throw new Error("offline");
      return stage;
    },
    plan: async (current) => (options.plan ?? ((c) => ({ stage: c + 1, flower: null, gain: 0 })))(current),
    casStage: async (expected, next) => {
      if (casFailures > 0) {
        casFailures -= 1;
        log.push("cas-lost");
        // 別の端末が先に進めた。
        stage += 1;
        return false;
      }
      if (stage !== expected) return false;
      stage = next;
      log.push(`cas:${expected}->${next}`);
      return true;
    },
    addFlowers: async (n) => {
      log.push(`flowers+${n}`);
    },
    commit: async (flower) => {
      log.push(`commit:${flower ?? "grew"}`);
    },
  };
  return { deps, log, pending: () => pending, stage: () => stage };
}

describe("applyPendingEvolutions", () => {
  test("保留が無ければ何もしない", async () => {
    const s = setup({ pending: 0 });
    expect(await applyPendingEvolutions(s.deps)).toBe(0);
    expect(s.log).toEqual([]);
  });

  test("成長は、段階を書いてから知らせる", async () => {
    const s = setup({ pending: 1, stage: 2 });
    expect(await applyPendingEvolutions(s.deps)).toBe(1);
    expect(s.log).toEqual(["take", "cas:2->3", "commit:grew"]);
    expect(s.stage()).toBe(3);
  });

  test("保留が複数あれば、1つずつ順に反映する", async () => {
    const s = setup({ pending: 2, stage: 0 });
    expect(await applyPendingEvolutions(s.deps)).toBe(2);
    expect(s.stage()).toBe(2);
    expect(s.pending()).toBe(0);
  });

  test("開花は、段階を0に戻し、花を足してから知らせる", async () => {
    const s = setup({
      pending: 1,
      stage: 5,
      plan: () => ({ stage: null, flower: "NightCherry", gain: 2 }),
    });
    expect(await applyPendingEvolutions(s.deps)).toBe(1);
    expect(s.log).toEqual(["take", "cas:5->0", "flowers+2", "commit:NightCherry"]);
  });

  test("別の端末に先を越されたら、読み直してやり直す", async () => {
    const s = setup({ pending: 1, stage: 1, casFailures: 2 });
    expect(await applyPendingEvolutions(s.deps)).toBe(1);
    // 2回負けて stage は 3 になり、3回目で 3->4。
    expect(s.stage()).toBe(4);
    expect(s.log.filter((l) => l === "cas-lost").length).toBe(2);
    expect(s.pending()).toBe(0);
  });

  test("やり直しても勝てなければ、保留に戻して止める（二重にも欠落にもしない）", async () => {
    const s = setup({ pending: 2, stage: 0, casFailures: 99 });
    expect(await applyPendingEvolutions(s.deps)).toBe(0);
    expect(s.pending()).toBe(2);
    expect(s.log.at(-1)).toBe("restore");
    expect(s.log.includes("commit:grew")).toBe(false);
  });

  test("クラウドを読めなければ、保留に戻して止める", async () => {
    const s = setup({ pending: 1, readError: true });
    expect(await applyPendingEvolutions(s.deps)).toBe(0);
    expect(s.pending()).toBe(1);
  });
});
