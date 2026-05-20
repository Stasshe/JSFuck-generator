import { describe, it, expect } from "vitest";
import { generateQuiz } from "../src/quiz.js";
import type { QuizConfig } from "../src/types.js";

describe("generateQuiz()", () => {
  it("returns ok:true for difficulty 1.0", () => {
    const config: QuizConfig = {
      difficulty: 1.0,
      strategy: "shortest",
      allowLiteral: false,
    };
    const result = generateQuiz(config);
    expect(result.ok).toBe(true);
  });

  it("actualDifficulty within ±0.5 of target", () => {
    const target = 1.5;
    const config: QuizConfig = {
      difficulty: target,
      strategy: "shortest",
      allowLiteral: true,
    };
    const result = generateQuiz(config);
    if (result.ok) {
      expect(result.question.actualDifficulty).toBeGreaterThanOrEqual(target - 0.5);
      expect(result.question.actualDifficulty).toBeLessThanOrEqual(target + 0.5);
    }
  });

  it("expression evaluates to answer", () => {
    const config: QuizConfig = {
      difficulty: 1.5,
      strategy: "shortest",
      allowLiteral: true,
    };
    const result = generateQuiz(config);
    if (result.ok) {
      // biome-ignore lint/security/noEval: intentional JSFuck evaluation test
      const evaluated = String(eval(result.question.expression));
      expect(evaluated).toBe(result.question.answer);
    }
  });

  it("respects config.length when provided", () => {
    const config: QuizConfig = {
      difficulty: 2.0,
      strategy: "shortest",
      allowLiteral: true,
      length: 3,
    };
    const result = generateQuiz(config);
    if (result.ok) {
      expect(result.question.answer.length).toBe(3);
    }
  });

  it("seeded rng is deterministic", () => {
    let s = 123;
    const rng = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return Math.abs(s) / 0xffffffff;
    };
    const config: QuizConfig = {
      difficulty: 1.5,
      strategy: "random",
      allowLiteral: true,
      rng,
    };
    const r1 = generateQuiz(config);

    s = 123;
    const rng2 = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return Math.abs(s) / 0xffffffff;
    };
    const config2: QuizConfig = { ...config, rng: rng2 };
    const r2 = generateQuiz(config2);

    if (r1.ok && r2.ok) {
      expect(r1.question.expression).toBe(r2.question.expression);
      expect(r1.question.answer).toBe(r2.question.answer);
    }
  });
});
