import { generate } from "./engine/generator.js";
import {
  DIFFICULTY_ATTEMPTS,
  difficultyError,
  isDifficultyWithinTolerance,
} from "./difficulty.js";
import { getPatterns } from "./patterns/index.js";
import type { GeneratorConfig, QuizQuestion, QuizConfig, QuizResult } from "./types.js";

function lengthRange(difficulty: number): [number, number] {
  if (difficulty <= 2.0) return [1, 2];
  if (difficulty <= 5.0) return [1, 3];
  if (difficulty <= 10.0) return [2, 5];
  return [4, 10];
}

function randomInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function buildQuizString(
  length: number,
  difficulty: number,
  allowLiteral: boolean,
  rng: () => number,
): string {
  const filter = {
    ...(allowLiteral ? {} : { kind: "jsfuck" as const }),
  };
  const candidates = getPatterns(filter).filter((p) => p.output.length === 1 && p.kind !== "literal");

  if (candidates.length === 0) return "a";

  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(rng() * candidates.length);
    result += candidates[idx]!.output;
  }
  return result;
}

export function generateQuiz(config: QuizConfig): QuizResult {
  const rng = config.rng ?? Math.random;
  const [minLen, maxLen] = lengthRange(config.difficulty);
  const targetLen = config.length ?? randomInt(minLen, maxLen, rng);

  const genConfig: GeneratorConfig = {
    difficulty: config.difficulty,
    allowLiteral: config.allowLiteral,
    rng,
  };
  let best: QuizQuestion | null = null;
  let bestError = Infinity;

  for (let attempt = 0; attempt < DIFFICULTY_ATTEMPTS; attempt++) {
    const quizStr = buildQuizString(targetLen, config.difficulty, config.allowLiteral, rng);
    const result = generate(quizStr, genConfig);

    if (!result.ok) continue;

    const question = {
      expression: result.expression,
      answer: quizStr,
      actualDifficulty: result.actualDifficulty,
      parts: result.parts,
    };
    const error = difficultyError(result.actualDifficulty, config.difficulty);

    if (isDifficultyWithinTolerance(result.actualDifficulty, config.difficulty)) {
      return {
        ok: true,
        question,
      };
    }

    if (error < bestError) {
      best = question;
      bestError = error;
    }
  }

  if (best !== null) {
    return {
      ok: true,
      question: best,
    };
  }

  return {
    ok: false,
    reason: `Could not generate quiz for difficulty ${config.difficulty}`,
  };
}
