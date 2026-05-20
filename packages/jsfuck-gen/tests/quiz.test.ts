import { describe, expect, it } from "vitest";
import { generateQuiz } from "../src/quiz.js";
import type { QuizConfig } from "../src/types.js";

describe("generateQuiz()", () => {
  it("returns ok:true for difficulty 1.0", () => {
    const config: QuizConfig = { difficulty: 1.0 };
    const result = generateQuiz(config);
    expect(result.ok).toBe(true);
  });

  it("actualDifficulty is within tolerance of target", () => {
    const target = 2;
    const config: QuizConfig = { difficulty: target };
    const result = generateQuiz(config);
    if (result.ok) {
      expect(Math.abs(result.question.actualDifficulty - target)).toBeLessThanOrEqual(1);
    }
  });

  it("allows unlimited upward error at max difficulty", () => {
    const result = generateQuiz({ difficulty: 20, length: 3, rng: () => 0.5 });
    expect(result.ok).toBe(true);
  });

  it("expression evaluates to answer", () => {
    const config: QuizConfig = { difficulty: 1.5 };
    const result = generateQuiz(config);
    if (result.ok) {
      // biome-ignore lint/security/noGlobalEval: intentional JSFuck evaluation test
      const evaluated = String(eval(result.question.expression));
      expect(evaluated).toBe(result.question.answer);
    }
  });

  it("respects config.length when provided", () => {
    const config: QuizConfig = { difficulty: 2.0, length: 3 };
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
    const r1 = generateQuiz({ difficulty: 1.5, rng });

    s = 123;
    const rng2 = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return Math.abs(s) / 0xffffffff;
    };
    const r2 = generateQuiz({ difficulty: 1.5, rng: rng2 });

    if (r1.ok && r2.ok) {
      expect(r1.question.expression).toBe(r2.question.expression);
      expect(r1.question.answer).toBe(r2.question.answer);
    }
  });
});
