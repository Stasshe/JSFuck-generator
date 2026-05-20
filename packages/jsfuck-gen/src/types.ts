export type Difficulty = number;

// "jsfuck"  : 最終出力パターン（DP がセグメント照合）
// "subexpr" : 中間表現パターン（deps 経由のみ使用、DP セグメント照合しない）
export type PatternKind = "jsfuck" | "subexpr";

export type Pattern = {
  id: string;

  // この式を評価したときの JS 文字列値
  // jsfuck パターン: DP がユーザー入力セグメントと照合するキー
  // subexpr パターン: デバッグ・説明用（照合には使われない）
  output: string;

  // @{role} プレースホルダーで他パターンから参照される識別子
  // 中間表現として使われるパターンに必須
  role?: string;

  kind: PatternKind;

  // JSFuck 式テンプレート。@{roleName} プレースホルダーを含んでよい
  expression: string;

  // expression 内で参照している role 名の一覧（解決器が依存関係を辿る）
  deps?: string[];

  // 代替式テンプレート（同じ意味、異なる JSFuck 表現）
  alternates?: string[];

  // true = []()!+ のみ使用（strict mode で使用可）
  // false = '"5"' 等のリテラルショートカットを含む
  pure: boolean;

  tags: string[];
  description?: string;
};

export type GeneratorConfig = {
  difficulty: Difficulty;
  // true: pure: true パターンのみ使用（[]()!+ のみの出力）
  strict?: boolean;
  rng?: () => number;
};

export type QuizConfig = {
  difficulty: Difficulty;
  strict?: boolean;
  length?: number;
  rng?: () => number;
};

// @{role} 解決後の導出ツリー（説明用）
export type Derivation = {
  patternId: string;
  expression: string;
  description: string | undefined;
  deps: Record<string, Derivation>;
};

export type GeneratedPart = {
  segment: string;
  pattern: Pattern;
  resolvedExpression: string;
  derivation: Derivation;
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
