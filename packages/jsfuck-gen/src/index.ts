export { generate } from "./engine/generator.js";
export { explainDerivation, explainParts } from "./engine/explain.js";
export { partDifficulty, patternDifficulty, patternTier } from "./difficulty.js";
export { getPatterns, getSiblings, ALL_PATTERNS } from "./patterns/index.js";
export { generateQuiz } from "./quiz.js";
export type {
  Derivation,
  Difficulty,
  GeneratedPart,
  GenerateFailure,
  GenerateResult,
  GenerateSuccess,
  GeneratorConfig,
  Pattern,
  PatternFilter,
  PatternKind,
  QuizConfig,
  QuizQuestion,
  QuizResult,
} from "./types.js";
