import { generate } from "./engine/generator.js";
import { getPatterns } from "./patterns/index.js";
import type { GeneratorConfig, QuizConfig, QuizResult } from "./types.js";

const MAX_QUIZ_ATTEMPTS = 10;

function lengthRange(difficulty: number): [number, number] {
  if (difficulty < 2.0) return [1, 2];
  if (difficulty < 3.0) return [2, 4];
  if (difficulty < 4.0) return [3, 6];
  return [5, 10];
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
    difficulty: { max: difficulty },
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
    strategy: config.strategy,
    allowLiteral: config.allowLiteral,
    rng,
  };

  for (let attempt = 0; attempt < MAX_QUIZ_ATTEMPTS; attempt++) {
    const quizStr = buildQuizString(targetLen, config.difficulty, config.allowLiteral, rng);
    const result = generate(quizStr, genConfig);

    if (!result.ok) continue;

    const lo = config.difficulty - 0.5;
    const hi = config.difficulty + 0.5;
    if (result.actualDifficulty < lo || result.actualDifficulty > hi) continue;

    return {
      ok: true,
      question: {
        expression: result.expression,
        answer: quizStr,
        actualDifficulty: result.actualDifficulty,
        parts: result.parts,
        totalCost: result.totalCost,
      },
    };
  }

  return {
    ok: false,
    reason: `Could not generate quiz within ${MAX_QUIZ_ATTEMPTS} attempts for difficulty ${config.difficulty}`,
  };
}
