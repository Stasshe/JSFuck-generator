import type { Pattern } from "../types.js";
import { AT_FN_STR, CONSTR_KEY, ENTRIES_ITER_STR, FILL_FN_STR, FILL_KEY, FUNC_CTOR, NAN_STR } from "./builder.js";

// Tier 3: difficulty 2.5~3.5
// Uppercase letters via constructor function strings
// Symbols from function toString representations
// Prerequisite: Tier 2 (all lowercase, g, S)

const T3_REQUIRES = [
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
];

// Uppercase from constructor fn strings at index 9:
// "function Xxxx() { [native code] }"[9] = 'X'

// Array constructor: ([]["constructor"]+"")[9] = 'A'
const A_UPPER_EXPR = `(""+[][${CONSTR_KEY}])[9]`;
// Boolean constructor: (false["constructor"]+"")[9] = 'B'
const B_UPPER_EXPR = `(""+(![])[${CONSTR_KEY}])[9]`;
// Function constructor: ([]["fill"]["constructor"]+"")[9] = 'F'
const F_UPPER_EXPR = `(""+${FUNC_CTOR})[9]`;
// Number constructor: ("" + (0)["constructor"])[9] = 'N'  (also in tier1 via NaN)
const N_UPPER_EXPR = `(""+((+[])[${CONSTR_KEY}]))[9]`; // "function Number..."[9]

// Symbols from function fn strings
// "function fill() { [native code] }"
// indices: ((13) )(14) {(16) [(18) ](30) }(32) space(8,15,17,19,25,31)
const OPEN_PAREN_EXPR = `${FILL_FN_STR}[13]`; // (
const CLOSE_PAREN_EXPR = `${FILL_FN_STR}[14]`; // )
const OPEN_BRACE_EXPR = `${FILL_FN_STR}[16]`; // {
const CLOSE_BRACE_EXPR = `${FILL_FN_STR}[32]`; // }
const OPEN_BRACKET_EXPR = `${FILL_FN_STR}[18]`; // [
const CLOSE_BRACKET_EXPR = `${FILL_FN_STR}[30]`; // ]

// Period '.' from (1/10+"")[1] = "0.1"[1]
const PERIOD_EXPR = `(+!![]/(!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![])+[])[1]`;

// Double quote from Function fn string
// "function Function() { [native code] }" - no double quote there
// Get via unescape approach is tier4, so we can get " from escape output:
// escape('"') = "%22", so we need tier4 for double quote

// Backtick not easily available in tier3

const TIER3: Pattern[] = [
  {
    id: "t3_A_upper",
    output: "A",
    expression: A_UPPER_EXPR,
    alternates: [`(${NAN_STR}+${ENTRIES_ITER_STR})[11]`],
    kind: "jsfuck",
    tags: ["tier3", "uppercase", "from_constructor"],
    trapFor: ["char_a"],
    requires: [...T3_REQUIRES],
    description: '"function Array(){...}"[9] — uppercase A',
  },
  {
    id: "t3_B_upper",
    output: "B",
    expression: B_UPPER_EXPR,
    kind: "jsfuck",
    tags: ["tier3", "uppercase", "from_constructor"],
    trapFor: [],
    requires: [...T3_REQUIRES],
    description: '"function Boolean(){...}"[9] — uppercase B',
  },
  {
    id: "t3_F_upper",
    output: "F",
    expression: F_UPPER_EXPR,
    kind: "jsfuck",
    tags: ["tier3", "uppercase", "from_constructor"],
    trapFor: ["char_f"],
    requires: [...T3_REQUIRES],
    description: '"function Function(){...}"[9] — uppercase F',
  },
  {
    id: "t3_open_paren",
    output: "(",
    expression: OPEN_PAREN_EXPR,
    alternates: [`${AT_FN_STR}[11]`],
    kind: "jsfuck",
    tags: ["tier3", "symbol", "from_fill_fn"],
    trapFor: [],
    requires: ["char_f", "char_i", "char_l"],
    description: '"function fill(){...}"[13] — open paren',
  },
  {
    id: "t3_close_paren",
    output: ")",
    expression: CLOSE_PAREN_EXPR,
    alternates: [`${AT_FN_STR}[12]`],
    kind: "jsfuck",
    tags: ["tier3", "symbol", "from_fill_fn"],
    trapFor: [],
    requires: ["char_f", "char_i", "char_l"],
    description: '"function fill(){...}"[14] — close paren',
  },
  {
    id: "t3_open_brace",
    output: "{",
    expression: OPEN_BRACE_EXPR,
    alternates: [`${AT_FN_STR}[14]`],
    kind: "jsfuck",
    tags: ["tier3", "symbol", "from_fill_fn"],
    trapFor: [],
    requires: ["char_f", "char_i", "char_l"],
    description: '"function fill(){...}"[16] — open brace',
  },
  {
    id: "t3_close_brace",
    output: "}",
    expression: CLOSE_BRACE_EXPR,
    alternates: [`${AT_FN_STR}[30]`],
    kind: "jsfuck",
    tags: ["tier3", "symbol", "from_fill_fn"],
    trapFor: [],
    requires: ["char_f", "char_i", "char_l"],
    description: '"function fill(){...}"[32] — close brace',
  },
  {
    id: "t3_open_bracket",
    output: "[",
    expression: OPEN_BRACKET_EXPR,
    alternates: [`${AT_FN_STR}[16]`, `${ENTRIES_ITER_STR}[+[]]`],
    kind: "jsfuck",
    tags: ["tier3", "symbol", "from_fill_fn"],
    trapFor: [],
    requires: ["char_f", "char_i", "char_l"],
    description: '"function fill(){...}"[18] — open bracket',
  },
  {
    id: "t3_close_bracket",
    output: "]",
    expression: CLOSE_BRACKET_EXPR,
    alternates: [`${AT_FN_STR}[28]`, `${ENTRIES_ITER_STR}[22]`],
    kind: "jsfuck",
    tags: ["tier3", "symbol", "from_fill_fn"],
    trapFor: [],
    requires: ["char_f", "char_i", "char_l"],
    description: '"function fill(){...}"[30] — close bracket',
  },
  {
    id: "t3_period",
    output: ".",
    expression: PERIOD_EXPR,
    kind: "jsfuck",
    tags: ["tier3", "symbol"],
    trapFor: [],
    requires: [],
    description: '(0.1+"")[1] — period via float',
  },
];

export default TIER3;
