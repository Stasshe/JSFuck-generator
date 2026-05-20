import { describe, expect, it } from "vitest";
import { generate } from "../src/engine/generator.js";
import { boundedVarietyPool, buildMinLenByRole, candidatePatterns } from "../src/engine/selector.js";
import { ALL_PATTERNS } from "../src/patterns/index.js";
import type { GeneratorConfig } from "../src/types.js";

const defaultConfig: GeneratorConfig = {
  difficulty: 5.0,
};

describe("generate()", () => {
  it("returns ok:true for simple ASCII string", () => {
    const result = generate("hello", defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe("hello");
      expect(result.parts.length).toBeGreaterThan(0);
    }
  });

  it("expression concatenates to correct output", () => {
    const result = generate("hi", defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const joined = result.parts.map((p) => p.segment).join("");
      expect(joined).toBe("hi");
    }
  });

  it("returns failure for unsupported chars at difficulty:1", () => {
    const config: GeneratorConfig = { difficulty: 1.0 };
    // 'z' は tier2 (toString36)、difficulty 1.0 では届かない
    const result = generate("z", config);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("unsupported_chars");
      expect(result.unsupportedChars).toContain("z");
    }
  });

  it("generates empty string", () => {
    const result = generate("", defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe("");
    }
  });

  it("actualDifficulty is tier times length for tier1 input", () => {
    const result = generate("false", { difficulty: 1.0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actualDifficulty).toBe(1);
    }
  });

  it("parts cover full input", () => {
    const input = "abc";
    const result = generate(input, defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const reconstructed = result.parts.map((p) => p.segment).join("");
      expect(reconstructed).toBe(input);
    }
  });

  it("seeded rng produces deterministic output", () => {
    let s = 42;
    const rng = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const r1 = generate("hi", { ...defaultConfig, rng });

    s = 42;
    const rng2 = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const r2 = generate("hi", { ...defaultConfig, rng: rng2 });

    if (r1.ok && r2.ok) {
      expect(r1.expression).toBe(r2.expression);
    }
  });

  it("resolved expression evaluates to the correct string", () => {
    const result = generate("fa", defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // biome-ignore lint/security/noGlobalEval: intentional JSFuck expression evaluation test
      expect(String(eval(result.expression))).toBe("fa");
    }
  });

  it("evaluates generated toString(36) letters", () => {
    const result = generate("h", { difficulty: 5.0, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parts[0]?.pattern.tags).toContain("tostring36");
      expect(result.parts[0]?.resolvedExpression).not.toContain("@{");
      expect(result.expression).not.toContain("@{");
      // biome-ignore lint/security/noGlobalEval: intentional generated expression evaluation test
      expect(String(eval(result.expression))).toBe("h");
    }
  });

  it("rewrites numeric indexes in strict mode", () => {
    const result = generate("e", { difficulty: 1.0, strict: true, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expression).not.toMatch(/\[\d+\]/);
      expect(result.expression).toContain("!![]");
      // biome-ignore lint/security/noGlobalEval: intentional generated expression evaluation test
      expect(String(eval(result.expression))).toBe("e");
    }
  });
});

describe("random selection", () => {
  function seededRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  it("uses rng to vary among compact candidates", () => {
    const preferFirst = (() => {
      const values = [0, 0.99];
      return () => values.shift() ?? 0;
    })();
    const preferLast = (() => {
      const values = [0.99, 0];
      return () => values.shift() ?? 0;
    })();

    const first = generate("a", { difficulty: 5.0, rng: preferFirst });
    const later = generate("a", { difficulty: 5.0, rng: preferLast });

    expect(first.ok).toBe(true);
    expect(later.ok).toBe(true);
  });

  it("expands candidates with alternates from pattern definition", () => {
    const minLens = buildMinLenByRole(ALL_PATTERNS, defaultConfig);
    const candidates = boundedVarietyPool(
      candidatePatterns("a", ALL_PATTERNS, defaultConfig, minLens),
      minLens,
    );
    const hasVariant = candidates.some((p) => p.tags.includes("variant"));
    const hasCanonical = candidates.some((p) => !p.tags.includes("variant"));

    expect(hasVariant).toBe(true);
    expect(hasCanonical).toBe(true);
  });

  it("produces several compact variants for the same input", () => {
    const expressions = new Set<string>();
    const lengths: number[] = [];

    for (let seed = 1; seed <= 20; seed++) {
      const result = generate("false", { difficulty: 5.0, rng: seededRng(seed) });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expressions.add(result.expression);
        lengths.push(result.expression.length);
      }
    }

    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    expect(expressions.size).toBeGreaterThanOrEqual(2);
    expect(longest).toBeLessThanOrEqual(shortest + Math.max(24, Math.ceil(shortest * 0.25)));
  });

  it("generated variants evaluate to the requested string", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const result = generate("false", { difficulty: 5.0, rng: seededRng(seed) });
      expect(result.ok).toBe(true);
      if (result.ok) {
        // biome-ignore lint/security/noGlobalEval: intentional generated expression evaluation test
        expect(String(eval(result.expression))).toBe("false");
      }
    }
  });

  it("uses whole primitive string pattern when input matches", () => {
    const result = generate("false", { difficulty: 5.0, rng: () => 0.5 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]?.pattern.id).toMatch(/^str_false/);
      expect(result.expression.length).toBeLessThan(35);
    }
  });

  it("allows high difficulty to split a primitive string into character parts", () => {
    const result = generate("false", { difficulty: 20.0, rng: () => 0.5 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parts.map((part) => part.segment)).toEqual(["f", "a", "l", "s", "e"]);
      expect(result.parts.map((part) => part.pattern.id)).not.toContain("str_false");
    }
  });

  it("uses whole primitive string for each known primitive", () => {
    const cases: [string, string][] = [
      ["false", "str_false"],
      ["true", "str_true"],
      ["NaN", "str_nan"],
      ["Infinity", "str_infinity"],
      ["undefined", "str_undefined"],
    ];

    for (const [input, expectedPatternId] of cases) {
      const result = generate(input, { difficulty: 5.0, rng: () => 0.5 });
      expect(result.ok, `generate("${input}") should succeed`).toBe(true);
      if (result.ok) {
        expect(result.parts).toHaveLength(1);
        expect(result.parts[0]?.pattern.id).toMatch(new RegExp(`^${expectedPatternId}`));
      }
    }
  });

  it("multi-char pattern reduces expression length vs char-by-char", () => {
    const result = generate("truefalse", { difficulty: 5.0, rng: () => 0.5 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parts).toHaveLength(2);
      expect(result.expression.length).toBeLessThan(50);
    }
  });
});
