import { patternTier } from "../difficulty.js";
import type { GeneratorConfig, Pattern } from "../types.js";
import { buildMinLenByRole, estimatedExprLength } from "./resolver.js";

// DP のセグメント照合用: output が一致する jsfuck パターンを返す
// subexpr パターンは含まない
export function candidatePatterns(
  segment: string,
  patterns: Pattern[],
  config: GeneratorConfig,
  minLenByRole: Map<string, number>,
): Pattern[] {
  const base = patterns.filter((p) => {
    if (p.kind !== "jsfuck") return false;
    if (p.output !== segment) return false;
    if (config.strict && !p.pure) return false;
    return patternTier(p) <= config.difficulty;
  });

  // alternates を展開して variant パターンを追加
  const variants = base.flatMap((p) =>
    (p.alternates ?? []).map((expr, i) => ({
      ...p,
      id: `${p.id}:alt_${i}`,
      expression: expr,
      alternates: [],
      tags: [...p.tags, "variant"],
    })),
  );

  return [...base, ...variants];
}

// 推定式長ベースの variety pool
export function boundedVarietyPool(
  candidates: Pattern[],
  minLenByRole: Map<string, number>,
): Pattern[] {
  const lengths = candidates.map((p) => estimatedExprLength(p, minLenByRole));
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(minLength + 24, Math.ceil(minLength * 1.8));
  return candidates.filter(
    (_, i) => (lengths[i] ?? Infinity) <= maxLength,
  );
}

export { buildMinLenByRole };
