import type { Pattern } from "../types.js";
import { _g, _S_upper, ENTRIES_ITER_STR, FILL_FN_STR, letterExpr, STR_CTOR_FN_STR } from "./builder.js";

// Tier 2: difficulty 1.5~2.5
// Lowercase letters not already covered by compact tier1 paths, via (n).toString(36)
// Prerequisite: c and o from fill fn string (tier1), then g from String ctor fn string

// Bootstrap: 'g' from "function String() { [native code] }"[14]
// g enables building "toString" key, enabling all toString(36) letters

const TIER2_REQUIRES = [
  "char_f",
  "char_i",
  "char_l",
  "char_c",
  "char_o",
  "char_n",
  "char_s",
  "char_t",
  "char_r",
  "char_u",
  "t2_bootstrap_g",
  "t2_S_upper",
];

// letter codes: a=10, b=11, ..., z=35
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

// Do not register toString(36) alternates for chars that already have compact
// tier1 expressions. Those alternates are valid JSFuck, but much too noisy for
// generated output.
const TIER1_CHARS = new Set(["a", "d", "e", "f", "i", "l", "n", "r", "s", "t", "u"]);

const ENTRIES_REQUIRES = ["char_e", "char_n", "char_t", "char_r", "char_i", "char_s"];

// 'b' and 'j' via [object Array Iterator] — entries() uses only tier1 chars
const B_ENTRIES_PATTERN: Pattern = {
  id: "t2_b_entries",
  output: "b",
  expression: `${ENTRIES_ITER_STR}[2]`,
  kind: "jsfuck",
  tags: ["tier2", "from_entries"],
  trapFor: [],
  requires: ENTRIES_REQUIRES,
  description: '"[object Array Iterator]"[2] — b',
};

const J_ENTRIES_PATTERN: Pattern = {
  id: "t2_j_entries",
  output: "j",
  expression: `${ENTRIES_ITER_STR}[3]`,
  kind: "jsfuck",
  tags: ["tier2", "from_entries"],
  trapFor: [],
  requires: ENTRIES_REQUIRES,
  description: '"[object Array Iterator]"[3] — j',
};

function makeLetter(ch: string, n: number): Pattern {
  return {
    id: `t2_${ch}`,
    output: ch,
    expression: letterExpr(n),
    kind: "jsfuck",
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
  tags: ["tier2", "bootstrap"],
  trapFor: [],
  requires: [
    "char_f",
    "char_i",
    "char_l",
    "char_c",
    "char_o",
    "char_n",
    "char_s",
    "char_t",
    "char_r",
    "char_u",
  ],
  description: '"function String(){[native code]}"[14] — g (bootstrap for toString)',
};

// 'S' uppercase from String ctor fn string
const S_UPPER_EXPR = `${STR_CTOR_FN_STR}[9]`;
const S_UPPER_PATTERN: Pattern = {
  id: "t2_S_upper",
  output: "S",
  expression: S_UPPER_EXPR,
  kind: "jsfuck",
  tags: ["tier2", "bootstrap", "uppercase"],
  trapFor: ["char_s"],
  requires: [
    "char_f",
    "char_i",
    "char_l",
    "char_c",
    "char_o",
    "char_n",
    "char_s",
    "char_t",
    "char_r",
    "char_u",
  ],
  description: '"function String(){[native code]}"[9] — uppercase S',
};

// 'v' from fill fn string index 23
const V_EXPR = `${FILL_FN_STR}[23]`;
const V_PATTERN: Pattern = {
  id: "t2_v_fill",
  output: "v",
  expression: V_EXPR,
  kind: "jsfuck",
  tags: ["tier2", "from_fill_fn"],
  trapFor: [],
  requires: ["char_f", "char_i", "char_l"],
  description: '"function fill(){[native code]}"[23] — v',
};

const TIER2: Pattern[] = [
  G_PATTERN,
  S_UPPER_PATTERN,
  V_PATTERN,
  B_ENTRIES_PATTERN,
  J_ENTRIES_PATTERN,
  ...LETTERS.split("")
    .map((ch, idx) => [ch, idx + 10] as const)
    .filter(([ch]) => !TIER1_CHARS.has(ch))
    .map(([ch, n]) => makeLetter(ch, n)),
];

export default TIER2;
