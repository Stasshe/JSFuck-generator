import type { Derivation, GeneratorConfig, Pattern } from "../types.js";

// @{role} プレースホルダーを正規表現で抽出
const PLACEHOLDER_RE = /@\{([^}]+)\}/g;

export function extractDeps(expression: string): string[] {
  const roles: string[] = [];
  for (const match of expression.matchAll(PLACEHOLDER_RE)) {
    if (match[1] !== undefined) roles.push(match[1]);
  }
  return [...new Set(roles)];
}

export function substituteTemplate(
  template: string,
  resolvedDeps: Record<string, Derivation>,
): string {
  return template.replace(PLACEHOLDER_RE, (_, role: string) => {
    const dep = resolvedDeps[role];
    if (dep === undefined) {
      throw new Error(`Unresolved dep role: "${role}" in template: ${template}`);
    }
    return dep.expression;
  });
}

export function expressionForConfig(pattern: Pattern, config: GeneratorConfig): string {
  return config.strict ? (pattern.strictExpression ?? pattern.expression) : pattern.expression;
}

export function alternatesForConfig(pattern: Pattern, config: GeneratorConfig): string[] {
  return config.strict
    ? (pattern.strictAlternates ?? pattern.alternates ?? [])
    : (pattern.alternates ?? []);
}

export function patternForConfig(pattern: Pattern, config: GeneratorConfig): Pattern {
  if (!config.strict) return pattern;
  return {
    ...pattern,
    expression: expressionForConfig(pattern, config),
    alternates: alternatesForConfig(pattern, config),
  };
}

// 指定 role を持つパターン候補を返す
// deps の解決では difficulty フィルタを適用しない:
// 親パターンが選ばれた時点でその deps は利用可能であるべきため
export function candidatesForRole(
  role: string,
  allPatterns: Pattern[],
  config: GeneratorConfig,
): Pattern[] {
  return allPatterns
    .filter((p) => {
      if (p.role !== role) return false;
      if (config.strict && !p.pure) return false;
      return true;
    })
    .map((p) => patternForConfig(p, config));
}

// 候補から推定式長で boundedVarietyPool 相当のものを返す
// コスト推定時は minEstLen を使う
function pickFromPool(candidates: Pattern[], rng: () => number): Pattern {
  const minLen = Math.min(...candidates.map((p) => p.expression.length));
  const maxLen = Math.max(minLen + 24, Math.ceil(minLen * 1.8));
  const pool = candidates.filter((p) => p.expression.length <= maxLen);
  const eligible = pool.length > 0 ? pool : candidates;
  return eligible[Math.floor(rng() * eligible.length)]!;
}

// パターンを再帰的に解決して Derivation を返す
// キャッシュなし: 同じ role でも毎回独立して候補を選ぶ（多様性優先）
export function resolvePattern(
  pattern: Pattern,
  allPatterns: Pattern[],
  config: GeneratorConfig,
  rng: () => number,
): Derivation {
  const template = expressionForConfig(pattern, config);
  const depRoles = extractDeps(template);

  if (depRoles.length === 0) {
    // プレースホルダーなし: そのまま返す
    return {
      patternId: pattern.id,
      expression: template,
      description: pattern.description,
      deps: {},
    };
  }

  const resolvedDeps: Record<string, Derivation> = {};

  for (const role of depRoles) {
    const candidates = candidatesForRole(role, allPatterns, config);
    if (candidates.length === 0) {
      throw new Error(
        `No candidates for dep role "${role}" (needed by pattern "${pattern.id}")`,
      );
    }
    const chosen = pickFromPool(candidates, rng);
    // 再帰解決（DAG なので終端する）
    resolvedDeps[role] = resolvePattern(chosen, allPatterns, config, rng);
  }

  const expression = substituteTemplate(template, resolvedDeps);

  return {
    patternId: pattern.id,
    expression,
    description: pattern.description,
    deps: resolvedDeps,
  };
}

// パターンの推定式長（@{role} を最小候補長で置換した長さ）
// DP の Pass1 コスト推定に使用
export function estimatedExprLength(
  pattern: Pattern,
  minLenByRole: Map<string, number>,
  config?: GeneratorConfig,
): number {
  const expression = config ? expressionForConfig(pattern, config) : pattern.expression;
  let len = expression.length;
  for (const match of expression.matchAll(PLACEHOLDER_RE)) {
    const role = match[1];
    if (role === undefined) continue;
    const placeholder = match[0].length; // "@{role}".length
    const actual = minLenByRole.get(role) ?? 0;
    len += actual - placeholder;
  }
  return Math.max(1, len);
}

// 全パターンから role ごとの最小推定式長を事前計算（トポロジカル順）
export function buildMinLenByRole(
  allPatterns: Pattern[],
  config: GeneratorConfig,
): Map<string, number> {
  const minLen = new Map<string, number>();

  // 依存関係の少ない順（最大 20 パス、DAG なので収束する）
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;

    for (const p of allPatterns) {
      if (!p.role) continue;
      if (config.strict && !p.pure) continue;
      // subexpr パターンは difficulty に関係なく minLen 計算に含める

      const est = estimatedExprLength(p, minLen, config);
      const current = minLen.get(p.role);
      if (current === undefined || est < current) {
        minLen.set(p.role, est);
        changed = true;
      }
    }

    if (!changed) break;
  }

  return minLen;
}
