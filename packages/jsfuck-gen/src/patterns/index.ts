import type { Pattern, PatternFilter } from "../types.js";
import { patternDifficulty } from "../difficulty.js";
import { generateAlternates, withStrictExpressions } from "./builder.js";
import TIER1 from "./tier1.js";
import TIER2 from "./tier2.js";
import TIER3 from "./tier3.js";
import TIER4 from "./tier4.js";

function withAlternates(p: Pattern): Pattern {
  const manual = p.alternates ?? [];
  const auto = generateAlternates(p.expression);
  const merged = [...new Set([...manual, ...auto])];
  const withMerged: Pattern = merged.length === 0 ? p : { ...p, alternates: merged };
  return withStrictExpressions(withMerged);
}

export const ALL_PATTERNS: Pattern[] = [
  ...TIER1,
  ...TIER2,
  ...TIER3,
  ...TIER4,
].map(withAlternates);

// DP のセグメント照合に使うパターン（subexpr を除く）
export const OUTPUT_PATTERNS: Pattern[] = ALL_PATTERNS.filter(
  (p) => p.kind === "jsfuck",
);

export function getPatterns(filter?: PatternFilter): Pattern[] {
  let result = OUTPUT_PATTERNS;

  if (filter?.output !== undefined) {
    result = result.filter((p) => p.output === filter.output);
  }
  if (filter?.kind !== undefined) {
    result = result.filter((p) => p.kind === filter.kind);
  }
  if (filter?.difficulty !== undefined) {
    const { min, max } = filter.difficulty;
    if (min !== undefined) result = result.filter((p) => patternDifficulty(p) >= min);
    if (max !== undefined) result = result.filter((p) => patternDifficulty(p) <= max);
  }
  if (filter?.tags !== undefined && filter.tags.length > 0) {
    result = result.filter((p) => filter.tags!.every((tag) => p.tags.includes(tag)));
  }

  return result;
}

export function getSiblings(patternId: string): Pattern[] {
  const target = ALL_PATTERNS.find((p) => p.id === patternId);
  if (target === undefined) return [];
  return ALL_PATTERNS.filter((p) => p.output === target.output && p.id !== patternId);
}
