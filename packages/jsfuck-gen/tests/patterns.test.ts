import { describe, expect, it } from "vitest";
import { ALL_PATTERNS } from "../src/patterns/index.js";
import type { Pattern } from "../src/types.js";

describe("Pattern dictionary integrity", () => {
  it("all IDs are unique", () => {
    const ids = ALL_PATTERNS.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("requires IDs all exist in dictionary", () => {
    const idSet = new Set(ALL_PATTERNS.map((p) => p.id));
    for (const p of ALL_PATTERNS) {
      for (const req of p.requires) {
        expect(idSet.has(req), `${p.id} requires "${req}" which does not exist`).toBe(true);
      }
    }
  });

  it("trapFor IDs all exist in dictionary", () => {
    const idSet = new Set(ALL_PATTERNS.map((p) => p.id));
    for (const p of ALL_PATTERNS) {
      for (const trap of p.trapFor) {
        expect(idSet.has(trap), `${p.id} trapFor "${trap}" which does not exist`).toBe(true);
      }
    }
  });

  it("requires difficulty <= own difficulty", () => {
    const patternMap = new Map(ALL_PATTERNS.map((p) => [p.id, p]));
    for (const p of ALL_PATTERNS) {
      for (const req of p.requires) {
        const reqPattern = patternMap.get(req)!;
        expect(
          reqPattern.difficulty,
          `${p.id} (diff=${p.difficulty}) requires ${req} (diff=${reqPattern.difficulty}) which has higher difficulty`,
        ).toBeLessThanOrEqual(p.difficulty);
      }
    }
  });

  it("no circular dependencies", () => {
    const patternMap = new Map(ALL_PATTERNS.map((p) => [p.id, p]));

    function hasCycle(id: string, visiting: Set<string>): boolean {
      if (visiting.has(id)) return true;
      const p = patternMap.get(id);
      if (!p || p.requires.length === 0) return false;
      visiting.add(id);
      for (const req of p.requires) {
        if (hasCycle(req, visiting)) return true;
      }
      visiting.delete(id);
      return false;
    }

    for (const p of ALL_PATTERNS) {
      expect(hasCycle(p.id, new Set()), `${p.id} has circular dependency`).toBe(false);
    }
  });

  it("difficulty is in range 0.5~5.0", () => {
    for (const p of ALL_PATTERNS) {
      expect(p.difficulty, `${p.id} difficulty out of range`).toBeGreaterThanOrEqual(0.5);
      expect(p.difficulty, `${p.id} difficulty out of range`).toBeLessThanOrEqual(5.0);
    }
  });

  it("weight > 0", () => {
    for (const p of ALL_PATTERNS) {
      expect(p.weight, `${p.id} weight must be > 0`).toBeGreaterThan(0);
    }
  });

  it("cost > 0", () => {
    for (const p of ALL_PATTERNS) {
      expect(p.cost, `${p.id} cost must be > 0`).toBeGreaterThan(0);
    }
  });

  // Spot-check: at least one pattern per output char for printable ASCII
  it("covers all printable ASCII with at least one pattern", () => {
    const covered = new Set(ALL_PATTERNS.map((p) => p.output));
    for (let code = 0x20; code <= 0x7e; code++) {
      const ch = String.fromCharCode(code);
      expect(
        covered.has(ch),
        `No pattern for char: ${JSON.stringify(ch)} (0x${code.toString(16)})`,
      ).toBe(true);
    }
  });
});

describe("Pattern expression correctness (eval)", () => {
  // Only test tier1 and tier2 patterns to keep test time reasonable
  // Tier3/tier4 expressions are extremely long but follow the same pattern
  const testable = ALL_PATTERNS.filter((p) => p.tags.includes("tier1") || p.tags.includes("tier2"));

  it.each(
    testable.map((p) => [p.id, p] as [string, Pattern]),
  )("expression %s evaluates to output", (_id, p) => {
    // biome-ignore lint/security/noGlobalEval: intentional JSFuck expression evaluation test
    const result = String(eval(p.expression));
    expect(result).toBe(p.output);
  });
});
