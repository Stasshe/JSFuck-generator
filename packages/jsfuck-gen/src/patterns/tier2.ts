import type { Pattern } from "../types.js";
import { letterExpr, TOSTRING_KEY, BASE36, numExpr, _g, STR_CTOR_FN_STR, FILL_FN_STR, CONSTR_KEY } from "./builder.js";

// Tier 2: difficulty 1.5~2.5
// All 26 lowercase letters via (n).toString(36)
// Prerequisite: c and o from fill fn string (tier1), then g from String ctor fn string

// Bootstrap: 'g' from "function String() { [native code] }"[14]
// g enables building "toString" key, enabling all toString(36) letters

const TIER2_REQUIRES = ["char_f", "char_i", "char_l", "char_c", "char_o", "char_n", "char_s", "char_t", "char_r", "char_u"];

// letter codes: a=10, b=11, ..., z=35
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

// Difficulty assignment: letters that overlap with tier1 get slightly higher difficulty
// New-in-tier2 letters get lower difficulty (they're the point of this tier)
const TIER1_CHARS = new Set(["a", "d", "e", "f", "i", "l", "n", "r", "s", "t", "u"]);

function makeLetter(ch: string, n: number): Pattern {
  const expr = letterExpr(n);
  const isNewChar = !TIER1_CHARS.has(ch);
  return {
    id: `t2_${ch}`,
    output: ch,
    expression: expr,
    kind: "jsfuck",
    difficulty: isNewChar ? 2.0 : 2.3,
    weight: 1,
    cost: expr.length,
    tags: ["tier2", "tostring36"],
    trapFor: [],
    requires: TIER2_REQUIRES,
    description: `(${n}).toString(36) = "${ch}"`,
  };
}

// 'g' bootstrap pattern — needed before any toString(36) letter
const G_EXPR = _g;
const G_PATTERN: Pattern = {
  id: "t2_bootstrap_g",
  output: "g",
  expression: G_EXPR,
  kind: "jsfuck",
  difficulty: 1.8,
  weight: 1,
  cost: G_EXPR.length,
  tags: ["tier2", "bootstrap"],
  trapFor: [],
  requires: ["char_f", "char_i", "char_l", "char_c", "char_o", "char_n", "char_s", "char_t", "char_r", "char_u"],
  description: '"function String(){[native code]}"[14] — g (bootstrap for toString)',
};

// 'S' uppercase from String ctor fn string
const S_UPPER_EXPR = `${STR_CTOR_FN_STR}[9]`;
const S_UPPER_PATTERN: Pattern = {
  id: "t2_S_upper",
  output: "S",
  expression: S_UPPER_EXPR,
  kind: "jsfuck",
  difficulty: 1.8,
  weight: 1,
  cost: S_UPPER_EXPR.length,
  tags: ["tier2", "bootstrap", "uppercase"],
  trapFor: ["char_s"],
  requires: ["char_f", "char_i", "char_l", "char_c", "char_o", "char_n", "char_s", "char_t", "char_r", "char_u"],
  description: '"function String(){[native code]}"[9] — uppercase S',
};

// 'v' from fill fn string index 23
const V_EXPR = `${FILL_FN_STR}[23]`;
const V_PATTERN: Pattern = {
  id: "t2_v",
  output: "v",
  expression: V_EXPR,
  kind: "jsfuck",
  difficulty: 1.9,
  weight: 1,
  cost: V_EXPR.length,
  tags: ["tier2", "from_fill_fn"],
  trapFor: [],
  requires: ["char_f", "char_i", "char_l"],
  description: '"function fill(){[native code]}"[23] — v',
};

const TIER2: Pattern[] = [
  G_PATTERN,
  S_UPPER_PATTERN,
  V_PATTERN,
  ...LETTERS.split("").map((ch, idx) => makeLetter(ch, idx + 10)),
];

export default TIER2;
