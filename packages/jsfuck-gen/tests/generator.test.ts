import { describe, it, expect } from "vitest";
import { generate } from "../src/engine/generator.js";
import type { GeneratorConfig } from "../src/types.js";

const defaultConfig: GeneratorConfig = {
  difficulty: 5.0,
  strategy: "shortest",
  allowLiteral: true,
};

describe("generate()", () => {
  it("returns ok:true for simple ASCII string", () => {
    const result = generate("hello", defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe("hello");
      expect(result.parts.length).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
    }
  });

  it("expression concatenates to correct output", () => {
    const result = generate("hi", defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const joined = result.parts.map((p) => p.pattern.output).join("");
      expect(joined).toBe("hi");
    }
  });

  it("returns failure for unsupported chars when allowLiteral:false and difficulty:1", () => {
    const config: GeneratorConfig = {
      difficulty: 1.0,
      strategy: "random",
      allowLiteral: false,
    };
    // 'z' is tier2 (difficulty 2.0), won't be reachable at difficulty 1.0
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

  it("actualDifficulty is 1~5", () => {
    const result = generate("false", defaultConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actualDifficulty).toBeGreaterThanOrEqual(1.0);
      expect(result.actualDifficulty).toBeLessThanOrEqual(5.0);
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

  it("shortest strategy minimizes totalCost vs random", () => {
    const shortResult = generate("test", { ...defaultConfig, strategy: "shortest" });
    const randomResult = generate("test", { ...defaultConfig, strategy: "random", rng: () => 0.5 });
    // shortest should not be worse than random
    if (shortResult.ok && randomResult.ok) {
      expect(shortResult.totalCost).toBeLessThanOrEqual(randomResult.totalCost);
    }
  });

  it("seeded rng produces deterministic output", () => {
    // Simple LCG seed
    let s = 42;
    const rng = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const cfg1: GeneratorConfig = { ...defaultConfig, strategy: "random", rng };
    const r1 = generate("hi", cfg1);

    s = 42;
    const rng2 = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const cfg2: GeneratorConfig = { ...defaultConfig, strategy: "random", rng: rng2 };
    const r2 = generate("hi", cfg2);

    if (r1.ok && r2.ok) {
      expect(r1.expression).toBe(r2.expression);
    }
  });
});

describe("weightedRandom distribution", () => {
  it("higher weight patterns selected more often", () => {
    // digit_0 has weight 3, char_space has weight 1
    // Run many times and check distribution
    const counts: Record<string, number> = {};
    const N = 200;

    for (let i = 0; i < N; i++) {
      const result = generate("0", {
        difficulty: 5.0,
        strategy: "random",
        allowLiteral: false,
      });
      if (result.ok && result.parts.length > 0) {
        const id = result.parts[0]!.pattern.id;
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }

    // digit_0 (weight 3) should appear more than char alternatives (weight 1)
    const digit0Count = counts["digit_0"] ?? 0;
    expect(digit0Count).toBeGreaterThan(N * 0.4);
  });
});
