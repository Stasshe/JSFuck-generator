import type { Pattern } from "../types.js";

// JSFuck expression utilities

const PRIMITIVE_SOURCE_ALTERNATES: Record<string, string[]> = {
  "(![]+[])": ["(!+!![]+[])"],
  "(!![]+[])": ["(!+[]+[])"],
  "([][+[]]+[])": ["([][[]]+[])"],
  "(+{}+[])": ["(+[{}]+[])", "([][[]]+(+[])+[])"],
  "(1/0+[])": ["(+!![]/+[]+[])", "(!+[]/+[]+[])"],
  "([]+{})": ["({}+[])"],
};

function numericIndexAlternates(n: number): string[] {
  if (n > 9) return [];
  if (n === 0) return ["+[]", "+![]", "[]-[]"];
  if (n === 1) return ["+!![]", "+!+[]"];
  const trues = Array(n).fill("!![]").join("+");
  const notPlus = Array(n).fill("!+[]").join("+");
  return [trues, notPlus, `+(${trues})`];
}

// expression テンプレートから @{role} プレースホルダーを除いた部分について
// numeric index と primitive source の alternates を生成する
export function generateAlternates(expr: string): string[] {
  // @{...} プレースホルダーが含まれる式は alternates 自動生成しない
  // (resolver が解決後に再生成すべきだが、現時点では保守的に skip)
  if (expr.includes("@{")) return [];

  const results = new Set<string>();

  for (const match of expr.matchAll(/\[(\d)\]/g)) {
    const n = Number(match[1]);
    const alts = numericIndexAlternates(n);
    const start = match.index!;
    const end = start + match[0].length;
    for (const alt of alts) {
      results.add(`${expr.slice(0, start)}[${alt}]${expr.slice(end)}`);
    }
  }

  for (const [atom, alts] of Object.entries(PRIMITIVE_SOURCE_ALTERNATES)) {
    let pos = expr.indexOf(atom);
    while (pos !== -1) {
      for (const alt of alts) {
        results.add(`${expr.slice(0, pos)}${alt}${expr.slice(pos + atom.length)}`);
      }
      pos = expr.indexOf(atom, pos + atom.length);
    }
  }

  return [...results];
}

// 数値 n を JSFuck の数式に変換（boolean 加算）
export function numExpr(n: number): string {
  if (n === 0) return "+[]";
  if (n === 1) return "+!![]";
  return Array(n).fill("(!![])").join("+");
}

export function strictExpression(expr: string): string {
  return expr.replace(/\[(\d+)\]/g, (_, rawIndex: string) => `[${numExpr(Number(rawIndex))}]`);
}

export function withStrictExpressions(pattern: Pattern): Pattern {
  if (!pattern.pure) return pattern;

  const strict = strictExpression(pattern.expression);
  const strictAlternates = pattern.alternates?.map(strictExpression);

  const next: Pattern = {
    ...pattern,
    strictExpression: strict,
  };
  if (strictAlternates !== undefined) next.strictAlternates = strictAlternates;
  return next;
}
