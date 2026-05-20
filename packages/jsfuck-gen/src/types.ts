export type Difficulty = number;

export type PatternKind = "jsfuck" | "literal";

export type Pattern = {
  id: string;
  output: string;
  expression: string;
  alternates?: string[];
  kind: PatternKind;
  tags: string[];
  trapFor: string[];
  requires: string[];
  description?: string;
};

export type GeneratorConfig = {
  difficulty: Difficulty;
  allowLiteral: boolean;
  rng?: () => number;
};

export type QuizConfig = {
  difficulty: Difficulty;
  allowLiteral: boolean;
  length?: number;
  rng?: () => number;
};

export type GeneratedPart = {
  segment: string;
  pattern: Pattern;
};

export type GenerateSuccess = {
  ok: true;
  output: string;
  expression: string;
  parts: GeneratedPart[];
  actualDifficulty: Difficulty;
};

export type GenerateFailure = {
  ok: false;
  reason: "unsupported_chars" | "no_candidates" | "generation_failed";
  unsupportedChars?: string[];
};

export type GenerateResult = GenerateSuccess | GenerateFailure;

export type QuizQuestion = {
  expression: string;
  answer: string;
  actualDifficulty: Difficulty;
  parts: GeneratedPart[];
};

export type QuizResult = { ok: true; question: QuizQuestion } | { ok: false; reason: string };

export type PatternFilter = {
  output?: string;
  difficulty?: { min?: Difficulty; max?: Difficulty };
  tags?: string[];
  kind?: PatternKind;
};
