import { describe, expect, it } from "vitest";
import { generateQuiz } from "../src/quiz.js";
import type { QuizConfig } from "../src/types.js";

describe("generateQuiz()", () => {
  it("returns ok:true for difficulty 1.0", () => {
    const config: QuizConfig = {
      difficulty: 1.0,
      allowLiteral: false,
    };
    const result = generateQuiz(config);
    expect(result.ok).toBe(true);
  });

  it("actualDifficulty is within tolerance of target", () => {
    const target = 2;
    const config: QuizConfig = {
      difficulty: target,
      allowLiteral: true,
    };
    const result = generateQuiz(config);
    if (result.ok) {
      expect(Math.abs(result.question.actualDifficulty - target)).toBeLessThanOrEqual(1);
    }
  });

  it("allows unlimited upward error at max difficulty", () => {
    const result = generateQuiz({
      difficulty: 20,
      allowLiteral: true,
      length: 6,
      rng: () => 0.99,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.question.actualDifficulty).toBeGreaterThan(21);
    }
  });

  it("expression evaluates to answer", () => {
    const config: QuizConfig = {
      difficulty: 1.5,
      allowLiteral: true,
    };
    const result = generateQuiz(config);
    if (result.ok) {
      // biome-ignore lint/security/noGlobalEval: intentional JSFuck evaluation test
      const evaluated = String(eval(result.question.expression));
      expect(evaluated).toBe(result.question.answer);
    }
  });

  it("respects config.length when provided", () => {
    const config: QuizConfig = {
      difficulty: 2.0,
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
