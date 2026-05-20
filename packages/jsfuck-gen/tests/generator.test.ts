import { describe, expect, it } from "vitest";
import { generate } from "../src/engine/generator.js";
import type { GeneratorConfig } from "../src/types.js";

const defaultConfig: GeneratorConfig = {
  difficulty: 5.0,
  allowLiteral: true,
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
      const joined = result.parts.map((p) => p.pattern.output).join("");
      expect(joined).toBe("hi");
    }
  });

  it("returns failure for unsupported chars when allowLiteral:false and difficulty:1", () => {
    const config: GeneratorConfig = {
      difficulty: 1.0,
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

  it("actualDifficulty is tier times length", () => {
    const result = generate("false", { difficulty: 1.0, allowLiteral: false });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actualDifficulty).toBe(5);
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
    // Simple LCG seed
    let s = 42;
    const rng = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const cfg1: GeneratorConfig = { ...defaultConfig, rng };
    const r1 = generate("hi", cfg1);

    s = 42;
    const rng2 = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const cfg2: GeneratorConfig = { ...defaultConfig, rng: rng2 };
    const r2 = generate("hi", cfg2);

    if (r1.ok && r2.ok) {
      expect(r1.expression).toBe(r2.expression);
    }
  });
});

describe("random selection", () => {
  it("uses rng to vary among compact candidates", () => {
    const preferFalseString = (() => {
      const values = [0, 0.99];
      return () => values.shift() ?? 0;
    })();
    const preferNanString = (() => {
      const values = [0.99, 0];
      return () => values.shift() ?? 0;
    })();

    const first = generate("a", {
      difficulty: 5.0,
      allowLiteral: true,
      rng: preferFalseString,
    });
    const later = generate("a", {
      difficulty: 5.0,
      allowLiteral: true,
      rng: preferNanString,
    });

    expect(first.ok).toBe(true);
    expect(later.ok).toBe(true);
    if (first.ok && later.ok) {
      expect(first.parts[0]?.pattern.id).not.toBe(later.parts[0]?.pattern.id);
    }
  });

  it("defaults to bounded variety instead of very long overlapping candidates", () => {
    const result = generate("a", { difficulty: 5.0, allowLiteral: true, rng: () => 0.99 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parts[0]?.pattern.id).not.toBe("t2_a");
    }
  });
});
