import { describe, expect, it } from "vitest";
import { patternDifficulty } from "../src/difficulty.js";
import { ALL_PATTERNS } from "../src/patterns/index.js";
import type { Pattern } from "../src/types.js";

describe("Pattern dictionary integrity", () => {
  it("all IDs are unique", () => {
    const ids = ALL_PATTERNS.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("deps roles all exist in ALL_PATTERNS", () => {
    const roleSet = new Set(ALL_PATTERNS.filter((p) => p.role).map((p) => p.role!));
    for (const p of ALL_PATTERNS) {
      for (const dep of (p.deps ?? [])) {
        expect(
          roleSet.has(dep),
          `${p.id} deps on role "${dep}" which has no pattern`,
        ).toBe(true);
      }
    }
  });

  it("no circular deps (DAG check)", () => {
    const byRole = new Map<string, Pattern[]>();
    for (const p of ALL_PATTERNS) {
      if (!p.role) continue;
      const list = byRole.get(p.role) ?? [];
      list.push(p);
      byRole.set(p.role, list);
    }

    function hasCycle(role: string, visiting: Set<string>): boolean {
      if (visiting.has(role)) return true;
      const patterns = byRole.get(role) ?? [];
      visiting.add(role);
      for (const p of patterns) {
        for (const dep of (p.deps ?? [])) {
          if (hasCycle(dep, new Set(visiting))) return true;
        }
      }
      return false;
    }

    for (const p of ALL_PATTERNS) {
      if (p.role) {
        expect(hasCycle(p.role, new Set()), `role "${p.role}" has circular dep`).toBe(false);
      }
    }
  });

  it("difficulty is positive", () => {
    for (const p of ALL_PATTERNS) {
      expect(patternDifficulty(p), `${p.id} difficulty must be > 0`).toBeGreaterThan(0);
    }
  });

  it("pure patterns expose strict expressions without numeric indexes", () => {
    for (const p of ALL_PATTERNS.filter((pattern) => pattern.pure)) {
      expect(p.strictExpression, `${p.id} must have a strict expression`).toBeDefined();
      expect(p.strictExpression, `${p.id} strict expression must not use numeric indexes`).not.toMatch(/\[\d+\]/);
      for (const alternate of p.strictAlternates ?? []) {
        expect(alternate, `${p.id} strict alternate must not use numeric indexes`).not.toMatch(/\[\d+\]/);
      }
    }
  });

  it("covers all printable ASCII with at least one jsfuck pattern", () => {
    const covered = new Set(
      ALL_PATTERNS.filter((p) => p.kind === "jsfuck").map((p) => p.output),
    );
    for (let code = 0x20; code <= 0x7e; code++) {
      const ch = String.fromCharCode(code);
      expect(
        covered.has(ch),
        `No jsfuck pattern for char: ${JSON.stringify(ch)} (0x${code.toString(16)})`,
      ).toBe(true);
    }
  });
});

describe("Pattern expression correctness (eval)", () => {
  // subexpr パターンは @{...} プレースホルダーを含むため直接 eval 不可 → スキップ
  // tier1 のみ eval テスト（すべて自己完結した式）
  const testable = ALL_PATTERNS.filter(
    (p) => p.kind === "jsfuck" && p.tags.includes("tier1") && !p.expression.includes("@{"),
  );

  it.each(
    testable.map((p) => [p.id, p] as [string, Pattern]),
  )("expression %s evaluates to output", (_id, p) => {
    // biome-ignore lint/security/noGlobalEval: intentional JSFuck expression evaluation test
    const result = String(eval(p.expression));
    expect(result).toBe(p.output);
  });
});
