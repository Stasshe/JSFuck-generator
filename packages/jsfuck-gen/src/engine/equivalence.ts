import type { Pattern } from "../types.js";

type EquivalenceRule = {
  id: string;
  apply: (expression: string) => string[];
};

const PRIMITIVE_SOURCE_ALTERNATES: Record<string, string[]> = {
  "(![]+[])": ["(!+!![]+[])"],
  "(!![]+[])": ["(!+[]+[])"],
  "([][+[]]+[])": ["([][[]]+[])"],
  "(+{}+[])": ["(+[{}]+[])", "([][[]]+(+[])+[])"],
  "(1/0+[])": ["(+!![]/+[]+[])", "(!+[]/+[]+[])"],
  "([]+{})": ["({}+[])"],
};

const ARITHMETIC_ATOM_ALTERNATES: Record<string, string[]> = {
  "1/0": ["+!![]/+[]", "!+[]/+[]"],
};

const RULES: EquivalenceRule[] = [
  {
    id: "primitive-source",
    apply: (expression) => replaceKnownAtoms(expression, PRIMITIVE_SOURCE_ALTERNATES),
  },
  {
    id: "arithmetic-atom",
    apply: (expression) => replaceKnownAtoms(expression, ARITHMETIC_ATOM_ALTERNATES),
  },
  {
    id: "numeric-index",
    apply: expandNumericIndexes,
  },
  {
    id: "paren",
    apply: (expression) => [`(${expression})`],
  },
];

export function expandEquivalentPatterns(pattern: Pattern): Pattern[] {
  const variants: Pattern[] = [];
  const seen = new Set([pattern.expression]);

  for (const rule of RULES) {
    for (const expression of rule.apply(pattern.expression)) {
      if (seen.has(expression)) continue;
      seen.add(expression);
      variants.push(makeVariant(pattern, rule.id, variants.length + 1, expression));
    }
  }

  return variants;
}

function makeVariant(
  pattern: Pattern,
  ruleId: string,
  index: number,
  expression: string,
): Pattern {
  return {
    ...pattern,
    id: `${pattern.id}:eq_${ruleId}_${index}`,
    expression,
    tags: [...pattern.tags, "variant", `eq:${ruleId}`],
  };
}

function replaceKnownAtoms(
  expression: string,
  alternatesByAtom: Record<string, string[]>,
): string[] {
  const variants: string[] = [];

  for (const [atom, alternates] of Object.entries(alternatesByAtom)) {
    let start = expression.indexOf(atom);
    while (start !== -1) {
      for (const alternate of alternates) {
        variants.push(expression.slice(0, start) + alternate + expression.slice(start + atom.length));
      }
      start = expression.indexOf(atom, start + atom.length);
    }
  }

  return variants;
}

function expandNumericIndexes(expression: string): string[] {
  const variants: string[] = [];

  for (const match of expression.matchAll(/\[(\d{1,2})\]/g)) {
    const rawIndex = match[1];
    const start = match.index;
    if (rawIndex === undefined || start === undefined) continue;

    for (const replacement of numericExpressionAlternates(Number(rawIndex))) {
      variants.push(
        expression.slice(0, start) +
          `[${replacement}]` +
          expression.slice(start + match[0].length),
      );
    }
  }

  return variants;
}

function numericExpressionAlternates(n: number): string[] {
  if (n < 0 || n > 9) return [];

  const variants = new Set<string>();
  if (n === 0) {
    variants.add("+[]");
    variants.add("+![]");
    variants.add("[]-[]");
  } else if (n === 1) {
    variants.add("+!![]");
    variants.add("+!+[]");
  } else {
    variants.add(Array(n).fill("!![]").join("+"));
    variants.add(Array(n).fill("!+[]").join("+"));
    variants.add(`+(${Array(n).fill("!![]").join("+")})`);
  }

  return [...variants];
}
