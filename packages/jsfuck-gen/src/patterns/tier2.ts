import type { Pattern } from "../types.js";
import { numExpr } from "./builder.js";

// Tier 2: difficulty 2~3
// 中間表現パターン（key_*, *_fn_str）と、それらから得られる文字
// すべて pure: true（[]()!+ のみ）

// ===== key_fill: "fill" キー式 =====
// f+i+l+l を組み立てる式。fill_fn_str の dep として使われる。
const KEY_FILL_EXPR = `(![]+[])[+[]]+([][+[]]+[])[5]+(![]+[])[2]+(![]+[])[2]`;

const KEY_FILL: Pattern = {
  id: "key_fill",
  output: "fill",
  role: "key_fill",
  expression: KEY_FILL_EXPR,
  deps: ["char_f", "char_i", "char_l"],
  pure: true,
  kind: "subexpr",
  tags: ["tier2", "key"],
  description: 'key expression for "fill" = f+i+l+l',
};

// ===== key_at: "at" キー式 =====
const KEY_AT_EXPR = `(![]+[])[1]+(!![]+[])[+[]]`;

const KEY_AT: Pattern = {
  id: "key_at",
  output: "at",
  role: "key_at",
  expression: KEY_AT_EXPR,
  deps: ["char_a", "char_t"],
  pure: true,
  kind: "subexpr",
  tags: ["tier2", "key"],
  description: 'key expression for "at" = a+t',
};

// ===== key_entries: "entries" キー式 =====
const KEY_ENTRIES_EXPR =
  `(![]+[])[4]+([][+[]]+[])[1]+(!![]+[])[+[]]+(!![]+[])[1]+([][+[]]+[])[5]+(![]+[])[4]+(![]+[])[3]`;

const KEY_ENTRIES: Pattern = {
  id: "key_entries",
  output: "entries",
  role: "key_entries",
  expression: KEY_ENTRIES_EXPR,
  deps: ["char_e", "char_n", "char_t", "char_r", "char_i", "char_s"],
  pure: true,
  kind: "subexpr",
  tags: ["tier2", "key"],
  description: 'key expression for "entries" = e+n+t+r+i+e+s',
};

// ===== fill_fn_str: "function fill() { [native code] }" =====
// Indices: f(0)u(1)n(2)c(3)t(4)i(5)o(6)n(7) (8)f(9)i(10)l(11)l(12)((13))(14) (15){(16) (17)[(18)n(19)a(20)t(21)i(22)v(23)e(24) (25)c(26)o(27)d(28)e(29)](30) (31)}(32)
const FILL_FN_STR: Pattern = {
  id: "fill_fn_str",
  output: "function fill() { [native code] }",
  role: "fill_fn_str",
  expression: `([][@{key_fill}]+[])`,
  deps: ["key_fill"],
  pure: true,
  kind: "subexpr",
  tags: ["tier2", "fn_str"],
  description: '[][fill_key]+[] = "function fill() { [native code] }"',
};

// ===== at_fn_str: "function at() { [native code] }" =====
// Indices: f(0)u(1)n(2)c(3)t(4)i(5)o(6)n(7) (8)a(9)t(10)((11))(12) (13){(14) (15)[(16)n(17)a(18)t(19)i(20)v(21)e(22) (23)c(24)o(25)d(26)e(27)](28) (29)}(30)
const AT_FN_STR: Pattern = {
  id: "at_fn_str",
  output: "function at() { [native code] }",
  role: "at_fn_str",
  expression: `([][@{key_at}]+[])`,
  deps: ["key_at"],
  pure: true,
  kind: "subexpr",
  tags: ["tier2", "fn_str"],
  description: '[][at_key]+[] = "function at() { [native code] }"',
};

// ===== entries_iter_str: "[object Array Iterator]" =====
// Indices: [(0)o(1)b(2)j(3)e(4)c(5)t(6) (7)A(8)r(9)r(10)a(11)y(12) (13)I(14)t(15)e(16)r(17)a(18)t(19)o(20)r(21)](22)
const ENTRIES_ITER_STR: Pattern = {
  id: "entries_iter_str",
  output: "[object Array Iterator]",
  role: "entries_iter_str",
  expression: `([][@{key_entries}]()+[])`,
  deps: ["key_entries"],
  pure: true,
  kind: "subexpr",
  tags: ["tier2", "fn_str"],
  description: '[][entries_key]()+[] = "[object Array Iterator]"',
};

// ===== char_c: fill_fn_str[3] =====
const CHAR_C_FILL: Pattern = {
  id: "char_c_fill",
  output: "c",
  role: "char_c",
  expression: `(@{fill_fn_str})[3]`,
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier2", "from_fill_fn"],
  description: '"function fill(){...}"[3] = c  (via fill fn string)',
};

// char_c 別候補: at_fn_str[3]
const CHAR_C_AT: Pattern = {
  id: "char_c_at",
  output: "c",
  role: "char_c",
  expression: `(@{at_fn_str})[3]`,
  deps: ["at_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier2", "from_at_fn"],
  description: '"function at(){...}"[3] = c  (via at fn string)',
};

// ===== char_o: fill_fn_str[6] =====
const CHAR_O_FILL: Pattern = {
  id: "char_o_fill",
  output: "o",
  role: "char_o",
  expression: `(@{fill_fn_str})[6]`,
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier2", "from_fill_fn"],
  description: '"function fill(){...}"[6] = o  (via fill fn string)',
};

// char_o 別候補: true+undefined+at()[10]
// (!![]+[]+[][at_key])[10] = "truefunction at(){...}"[10] = o
const CHAR_O_AT: Pattern = {
  id: "char_o_at",
  output: "o",
  role: "char_o",
  expression: `(!![]+[]+[][@{key_at}])[10]`,
  deps: ["key_at"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier2", "from_at_fn"],
  description: '(!![]+[]+[][at_key])[10] = "truefunction at(){...}"[10] = o',
};

// ===== char_v: fill_fn_str[23] =====
const CHAR_V: Pattern = {
  id: "char_v",
  output: "v",
  role: "char_v",
  expression: `(@{fill_fn_str})[23]`,
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier2", "from_fill_fn"],
  description: '"function fill(){...}"[23] = v',
};

// ===== char_b: entries_iter_str[2] =====
const CHAR_B: Pattern = {
  id: "char_b",
  output: "b",
  role: "char_b",
  expression: `(@{entries_iter_str})[2]`,
  deps: ["entries_iter_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier2", "from_entries"],
  description: '"[object Array Iterator]"[2] = b',
};

// ===== char_j: entries_iter_str[3] =====
const CHAR_J: Pattern = {
  id: "char_j",
  output: "j",
  role: "char_j",
  expression: `(@{entries_iter_str})[3]`,
  deps: ["entries_iter_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier2", "from_entries"],
  description: '"[object Array Iterator]"[3] = j',
};

// toString(36) による文字は tier3 で定義する（key_tostring への依存が tier3 のため）

// ===== base36: toString の基数 36 =====
// non-strict: '"36"' リテラル（JS が数値に型変換）
const BASE36_NONSTRICT: Pattern = {
  id: "base36",
  output: "36",
  role: "base36",
  expression: '"36"',
  pure: false,
  kind: "subexpr",
  tags: ["tier2", "base36"],
  description: 'base 36 for toString(36) — literal shortcut',
};

// strict 版: 6*6 = 36
const BASE36_STRICT: Pattern = {
  id: "base36_strict",
  output: "36",
  role: "base36",
  expression:
    "(!![]+!![]+!![]+!![]+!![]+!![])*(!![]+!![]+!![]+!![]+!![]+!![])",
  pure: true,
  kind: "subexpr",
  tags: ["tier2", "base36", "strict"],
  description: "6*6 = 36 (pure JSFuck)",
};

const TIER2: Pattern[] = [
  KEY_FILL,
  KEY_AT,
  KEY_ENTRIES,
  FILL_FN_STR,
  AT_FN_STR,
  ENTRIES_ITER_STR,
  CHAR_C_FILL,
  CHAR_C_AT,
  CHAR_O_FILL,
  CHAR_O_AT,
  CHAR_V,
  CHAR_B,
  CHAR_J,
  BASE36_NONSTRICT,
  BASE36_STRICT,
];

export default TIER2;
