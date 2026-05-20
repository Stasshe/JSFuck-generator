import { generate } from "./engine/generator.js";
import { getPatterns } from "./patterns/index.js";
import { patternTier } from "./difficulty.js";
import type { GeneratorConfig, QuizConfig, QuizResult } from "./types.js";

const MAX_QUIZ_ATTEMPTS = 10;
const MAX_DIFFICULTY = 5;
const DIFFICULTY_TOLERANCE = 1;
const MAX_TIER = 5;

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
  strict: boolean,
  rng: () => number,
): string {
  const candidates = getPatterns()
    .filter((p) => p.output.length === 1)
    .filter((p) => (strict ? p.pure : true))
    .filter((p) => patternTier(p) <= difficulty);

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
  const strict = config.strict ?? false;
  const [minLen, maxLen] = lengthRange(config.difficulty);
  const targetLen = config.length ?? randomInt(minLen, maxLen, rng);

  const genConfig: GeneratorConfig = {
    difficulty: config.difficulty,
    strict,
    rng,
  };

  for (let attempt = 0; attempt < MAX_QUIZ_ATTEMPTS; attempt++) {
    const quizStr = buildQuizString(targetLen, config.difficulty, strict, rng);
    const result = generate(quizStr, genConfig);

    if (!result.ok) continue;

    const belowTarget =
      config.difficulty <= MAX_TIER &&
      result.actualDifficulty < config.difficulty - DIFFICULTY_TOLERANCE;
    const aboveTarget =
      config.difficulty < MAX_DIFFICULTY &&
      result.actualDifficulty > config.difficulty + DIFFICULTY_TOLERANCE;
    if (belowTarget || aboveTarget) continue;

    return {
      ok: true,
      question: {
        expression: result.expression,
        answer: quizStr,
        actualDifficulty: result.actualDifficulty,
        parts: result.parts,
      },
    };
  }

  return {
    ok: false,
    reason: `Could not generate quiz within ${MAX_QUIZ_ATTEMPTS} attempts for difficulty ${config.difficulty}`,
  };
}
