import type { Pattern, PatternFilter } from "../types.js";
import { patternDifficulty } from "../difficulty.js";
import { generateAlternates } from "./builder.js";
import TIER1 from "./tier1.js";
import TIER2 from "./tier2.js";
import TIER3 from "./tier3.js";
import TIER4 from "./tier4.js";

function withAlternates(p: Pattern): Pattern {
  const manual = p.alternates ?? [];
  const auto = generateAlternates(p.expression);
  return { ...p, alternates: [...new Set([...manual, ...auto])] };
}

const ALL_PATTERNS: Pattern[] = [...TIER1, ...TIER2, ...TIER3, ...TIER4].map(withAlternates);

// Add literal fallback patterns for any ASCII printable char not covered
function makeLiteral(ch: string): Pattern {
  const code = ch.charCodeAt(0);
  return {
    id: `literal_${code}`,
    output: ch,
    expression: JSON.stringify(ch),
    alternates: [],
    kind: "literal",
    tags: ["literal", "fallback"],
    trapFor: [],
    requires: [],
  };
}

// Collect all outputs already covered by jsfuck patterns
const covered = new Set(ALL_PATTERNS.map((p) => p.output));

// Add literal fallbacks for printable ASCII (0x20-0x7E)
for (let code = 0x20; code <= 0x7e; code++) {
  const ch = String.fromCharCode(code);
  if (!covered.has(ch)) {
    ALL_PATTERNS.push(makeLiteral(ch));
  }
}

export function getPatterns(filter?: PatternFilter): Pattern[] {
  let result = ALL_PATTERNS;

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

export { ALL_PATTERNS };
