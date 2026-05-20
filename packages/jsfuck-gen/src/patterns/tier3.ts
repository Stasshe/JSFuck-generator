import type { Pattern } from "../types.js";
import { numExpr } from "./builder.js";

// Tier 3: difficulty 3~4
// key_constructor とそれに依存する fn strings、uppercase 文字、HTML メソッド系

// ===== key_constructor: "constructor" キー式 =====
// c+o+n+s+t+r+u+c+t+o+r (11文字)
// char_c, char_o は tier2 で複数候補あり → この key も多様な式を持てる

// v1: char_c = fill 由来、char_o = fill 由来
const KEY_CONSTRUCTOR_V1: Pattern = {
  id: "key_constructor_v1",
  output: "constructor",
  role: "key_constructor",
  expression:
    `@{char_c}+@{char_o}+([][+[]]+[])[1]+(![]+[])[3]+(!![]+[])[+[]]+(!![]+[])[1]+([][+[]]+[])[+[]]+@{char_c}+(!![]+[])[+[]]+@{char_o}+(!![]+[])[1]`,
  deps: ["char_c", "char_o"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "key"],
  description: 'key expression for "constructor" = c+o+n+s+t+r+u+c+t+o+r',
};

// ===== str_ctor_fn_str: "function String() { [native code] }" =====
// Indices: f(0)u(1)n(2)c(3)t(4)i(5)o(6)n(7) (8)S(9)t(10)r(11)i(12)n(13)g(14)
const STR_CTOR_FN_STR: Pattern = {
  id: "str_ctor_fn_str",
  output: "function String() { [native code] }",
  role: "str_ctor_fn_str",
  expression: `(""+([]+[])[@{key_constructor}])`,
  deps: ["key_constructor"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "fn_str"],
  description:
    '(""+([]+[])[constructor_key]) = "function String() { [native code] }"',
};

// ===== num_ctor_fn_str: "function Number() { [native code] }" =====
// Indices: f(0)u(1)n(2)c(3)t(4)i(5)o(6)n(7) (8)N(9)u(10)m(11)b(12)e(13)r(14)
const NUM_CTOR_FN_STR: Pattern = {
  id: "num_ctor_fn_str",
  output: "function Number() { [native code] }",
  role: "num_ctor_fn_str",
  expression: `(""+((+[])[@{key_constructor}]))`,
  deps: ["key_constructor"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "fn_str"],
  description:
    '(""+((+[])[constructor_key])) = "function Number() { [native code] }"',
};

// ===== arr_ctor_fn_str: "function Array() { [native code] }" =====
const ARR_CTOR_FN_STR: Pattern = {
  id: "arr_ctor_fn_str",
  output: "function Array() { [native code] }",
  role: "arr_ctor_fn_str",
  expression: `(""+[][@{key_constructor}])`,
  deps: ["key_constructor"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "fn_str"],
  description:
    '(""+[][constructor_key]) = "function Array() { [native code] }"',
};

// ===== bool_ctor_fn_str: "function Boolean() { [native code] }" =====
const BOOL_CTOR_FN_STR: Pattern = {
  id: "bool_ctor_fn_str",
  output: "function Boolean() { [native code] }",
  role: "bool_ctor_fn_str",
  expression: `(""+(![][@{key_constructor}]))`,
  deps: ["key_constructor"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "fn_str"],
  description:
    '(""+(![][constructor_key])) = "function Boolean() { [native code] }"',
};

// ===== func_ctor: Function コンストラクタ =====
// [][fill][constructor] — eval のために使用
// key_func は "constructor" と同じ文字列
const FUNC_CTOR: Pattern = {
  id: "func_ctor",
  output: "function Function() { [native code] }",
  role: "func_ctor",
  expression: `[][@{key_fill}][@{key_constructor}]`,
  deps: ["key_fill", "key_constructor"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "func_ctor"],
  description: "[][fill][constructor] = Function constructor",
};

// ===== char_g: str_ctor_fn_str[14] =====
const CHAR_G: Pattern = {
  id: "char_g",
  output: "g",
  role: "char_g",
  expression: `(@{str_ctor_fn_str})[14]`,
  deps: ["str_ctor_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "from_str_ctor"],
  description: '"function String(){...}"[14] = g',
};

// ===== char_S_upper: str_ctor_fn_str[9] =====
const CHAR_S_UPPER: Pattern = {
  id: "char_S_upper",
  output: "S",
  role: "char_S_upper",
  expression: `(@{str_ctor_fn_str})[9]`,
  deps: ["str_ctor_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "from_str_ctor", "uppercase"],
  description: '"function String(){...}"[9] = S (uppercase)',
};

// ===== char_m: num_ctor_fn_str[11] =====
const CHAR_M: Pattern = {
  id: "char_m",
  output: "m",
  role: "char_m",
  expression: `(@{num_ctor_fn_str})[11]`,
  deps: ["num_ctor_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "from_num_ctor"],
  description: '"function Number(){...}"[11] = m',
};

// ===== Uppercase from constructor fn strings[9] =====
const CHAR_A_UPPER_ARR: Pattern = {
  id: "char_A_upper_arr",
  output: "A",
  role: "char_A_upper",
  expression: `(@{arr_ctor_fn_str})[9]`,
  deps: ["arr_ctor_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "uppercase", "from_arr_ctor"],
  description: '"function Array(){...}"[9] = A',
};

// A 別候補: NaN + entries_iter_str の連結
const CHAR_A_UPPER_NAN: Pattern = {
  id: "char_A_upper_nan",
  output: "A",
  role: "char_A_upper",
  expression: `((+{}+[])+@{entries_iter_str})[11]`,
  deps: ["entries_iter_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "uppercase", "from_entries"],
  description: '"NaN[object Array Iterator]"[11] = A',
};

const CHAR_B_UPPER: Pattern = {
  id: "char_B_upper",
  output: "B",
  role: "char_B_upper",
  expression: `(@{bool_ctor_fn_str})[9]`,
  deps: ["bool_ctor_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "uppercase", "from_bool_ctor"],
  description: '"function Boolean(){...}"[9] = B',
};

const CHAR_F_UPPER: Pattern = {
  id: "char_F_upper",
  output: "F",
  role: "char_F_upper",
  expression: `(@{func_ctor_fn_str})[9]`,
  deps: ["func_ctor_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "uppercase", "from_func_ctor"],
  description: '"function Function(){...}"[9] = F',
};

// func_ctor fn string
const FUNC_CTOR_FN_STR: Pattern = {
  id: "func_ctor_fn_str",
  output: "function Function() { [native code] }",
  role: "func_ctor_fn_str",
  expression: `(""+@{func_ctor})`,
  deps: ["func_ctor"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "fn_str"],
  description: '(""+func_ctor) = "function Function() { [native code] }"',
};

// ===== key_tostring: "toString" キー式 =====
// t+o+S+t+r+i+n+g (toStringは camelCase)
const KEY_TOSTRING: Pattern = {
  id: "key_tostring",
  output: "toString",
  role: "key_tostring",
  expression: `(!![]+[])[+[]]+@{char_o}+@{char_S_upper}+(!![]+[])[+[]]+(!![]+[])[1]+([][+[]]+[])[5]+([][+[]]+[])[1]+@{char_g}`,
  deps: ["char_o", "char_S_upper", "char_g"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "key"],
  description: 'key expression for "toString" = t+o+S+t+r+i+n+g',
};

// ===== symbols from fill_fn_str =====
const OPEN_PAREN: Pattern = {
  id: "t3_open_paren",
  output: "(",
  role: "char_open_paren",
  expression: `(@{fill_fn_str})[13]`,
  alternates: [`(@{at_fn_str})[11]`],
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_fill_fn"],
  description: '"function fill(){...}"[13] = ( (open paren)',
};

const CLOSE_PAREN: Pattern = {
  id: "t3_close_paren",
  output: ")",
  role: "char_close_paren",
  expression: `(@{fill_fn_str})[14]`,
  alternates: [`(@{at_fn_str})[12]`],
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_fill_fn"],
  description: '"function fill(){...}"[14] = ) (close paren)',
};

const OPEN_BRACE: Pattern = {
  id: "t3_open_brace",
  output: "{",
  role: "char_open_brace",
  expression: `(@{fill_fn_str})[16]`,
  alternates: [`(@{at_fn_str})[14]`],
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_fill_fn"],
  description: '"function fill(){...}"[16] = { (open brace)',
};

const CLOSE_BRACE: Pattern = {
  id: "t3_close_brace",
  output: "}",
  role: "char_close_brace",
  expression: `(@{fill_fn_str})[32]`,
  alternates: [`(@{at_fn_str})[30]`],
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_fill_fn"],
  description: '"function fill(){...}"[32] = } (close brace)',
};

const OPEN_BRACKET: Pattern = {
  id: "t3_open_bracket",
  output: "[",
  role: "char_open_bracket",
  expression: `(@{fill_fn_str})[18]`,
  alternates: [`(@{at_fn_str})[16]`, `(@{entries_iter_str})[+[]]`],
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_fill_fn"],
  description: '"function fill(){...}"[18] = [ (open bracket)',
};

const CLOSE_BRACKET: Pattern = {
  id: "t3_close_bracket",
  output: "]",
  role: "char_close_bracket",
  expression: `(@{fill_fn_str})[30]`,
  alternates: [`(@{at_fn_str})[28]`, `(@{entries_iter_str})[22]`],
  deps: ["fill_fn_str"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_fill_fn"],
  description: '"function fill(){...}"[30] = ] (close bracket)',
};

const PERIOD: Pattern = {
  id: "t3_period",
  output: ".",
  role: "char_period",
  expression: `(+!![]/(!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![])+[])[1]`,
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol"],
  description: '(0.1+"")[1] = . (period via float)',
};

// ===== HTML method-based chars =====

// key_italics: "italics" = i+t+a+l+i+c+s
const KEY_ITALICS: Pattern = {
  id: "key_italics",
  output: "italics",
  role: "key_italics",
  expression:
    `([][+[]]+[])[5]+(!![]+[])[+[]]+(![]+[])[1]+(![]+[])[2]+([][+[]]+[])[5]+@{char_c}+(![]+[])[3]`,
  deps: ["char_c"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "key"],
  description: 'key expression for "italics" = i+t+a+l+i+c+s',
};

// key_fontcolor: "fontcolor" = f+o+n+t+c+o+l+o+r
const KEY_FONTCOLOR: Pattern = {
  id: "key_fontcolor",
  output: "fontcolor",
  role: "key_fontcolor",
  expression:
    `(![]+[])[+[]]+@{char_o}+([][+[]]+[])[1]+(!![]+[])[+[]]+@{char_c}+@{char_o}+(![]+[])[2]+@{char_o}+(!![]+[])[1]`,
  deps: ["char_o", "char_c"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "key"],
  description: 'key expression for "fontcolor" = f+o+n+t+c+o+l+o+r',
};

// key_concat: "concat" = c+o+n+c+a+t
const KEY_CONCAT: Pattern = {
  id: "key_concat",
  output: "concat",
  role: "key_concat",
  expression: `@{char_c}+@{char_o}+([][+[]]+[])[1]+@{char_c}+(![]+[])[1]+(!![]+[])[+[]]`,
  deps: ["char_c", "char_o"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "key"],
  description: 'key expression for "concat" = c+o+n+c+a+t',
};

// italics_call: "".italics() = "<i></i>"
// Indices: <(0)i(1)>(2)<(3)/(4)i(5)>(6)
const ITALICS_CALL: Pattern = {
  id: "italics_call",
  output: "<i></i>",
  role: "italics_call",
  expression: `([]+[])[@{key_italics}]()`,
  deps: ["key_italics"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "html_call"],
  description: '"".italics() = "<i></i>"',
};

// fontcolor_call: "".fontcolor() = '<font color="undefined"></font>'
// Indices: <(0)..=(11)"(12)..>(23)<(24)/(25)..>(30)
const FONTCOLOR_CALL: Pattern = {
  id: "fontcolor_call",
  output: '<font color="undefined"></font>',
  role: "fontcolor_call",
  expression: `([]+[])[@{key_fontcolor}]()`,
  deps: ["key_fontcolor"],
  pure: true,
  kind: "subexpr",
  tags: ["tier3", "html_call"],
  description: '"".fontcolor() = \'<font color="undefined"></font>\'',
};

const CHAR_LT: Pattern = {
  id: "t3_lt",
  output: "<",
  role: "char_lt",
  expression: `(@{italics_call})[+[]]`,
  deps: ["italics_call"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_html"],
  description: '"".italics()[0] = "<i></i>"[0] = <',
};

const CHAR_GT: Pattern = {
  id: "t3_gt",
  output: ">",
  role: "char_gt",
  expression: `(@{italics_call})[2]`,
  deps: ["italics_call"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_html"],
  description: '"".italics()[2] = "<i></i>"[2] = >',
};

const CHAR_SLASH: Pattern = {
  id: "t3_slash",
  output: "/",
  role: "char_slash",
  expression: `(@{italics_call})[4]`,
  deps: ["italics_call"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_html"],
  description: '"".italics()[4] = "<i></i>"[4] = /',
};

const CHAR_EQ: Pattern = {
  id: "t3_eq",
  output: "=",
  role: "char_eq",
  expression: `(@{fontcolor_call})[11]`,
  deps: ["fontcolor_call"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_html"],
  description: '"".fontcolor()[11] = \'<font color="..."...\' [11] = =',
};

const CHAR_DQUOTE: Pattern = {
  id: "t3_dquote",
  output: '"',
  role: "char_dquote",
  expression: `(@{fontcolor_call})[12]`,
  deps: ["fontcolor_call"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_html"],
  description: '"".fontcolor()[12] = \'"\'',
};

const CHAR_COMMA: Pattern = {
  id: "t3_comma",
  output: ",",
  role: "char_comma",
  expression: `([[]][@{key_concat}]([[]])+[])[+[]]`,
  deps: ["key_concat"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier3", "symbol", "from_concat"],
  description: "[[]].concat([[]])+[] = \",\" — array concat stringified",
};

// ===== toString(36) の m は tier3 で定義済み =====
// k, p, q, w, x, z は tier2 で toString(36) パターンとして登録される
// ただし key_tostring が tier3 なので toString 系は実質 tier3 以降で使用可能

// ===== toString(36) に追加: m は num_ctor から取るほうが安い場合もある =====
// m = (22).toString(36) でも取れるが、num_ctor_fn_str[11] の方が短い
// 両方登録して DP に選ばせる
function makeT3ToStringLetter(ch: string, n: number): Pattern {
  return {
    id: `t3_tostring_${ch}`,
    output: ch,
    role: `char_${ch}`,
    expression: `(${numExpr(n)})[@{key_tostring}](@{base36})`,
    deps: ["key_tostring", "base36"],
    pure: true,
    kind: "jsfuck",
    tags: ["tier3", "tostring36"],
    description: `(${n}).toString(36) = "${ch}"  (tier3 path)`,
  };
}

// m は両方候補として登録
const CHAR_M_TOSTRING = makeT3ToStringLetter("m", 22);

// tier1/tier2 で取得済み: a,b,c,d,e,f,g,i,j,l,m,n,o,r,s,t,u,v
// 残り: h(17),k(20),p(25),q(26),w(32),x(33),y(34),z(35)
const TOSTRING_LETTERS: Pattern[] = (
  [
    ["h", 17],
    ["k", 20],
    ["p", 25],
    ["q", 26],
    ["w", 32],
    ["x", 33],
    ["y", 34],
    ["z", 35],
  ] as const
).map(([ch, n]) => makeT3ToStringLetter(ch, n));

const TIER3: Pattern[] = [
  KEY_CONSTRUCTOR_V1,
  STR_CTOR_FN_STR,
  NUM_CTOR_FN_STR,
  ARR_CTOR_FN_STR,
  BOOL_CTOR_FN_STR,
  FUNC_CTOR,
  FUNC_CTOR_FN_STR,
  CHAR_G,
  CHAR_S_UPPER,
  CHAR_M,
  CHAR_M_TOSTRING,
  CHAR_A_UPPER_ARR,
  CHAR_A_UPPER_NAN,
  CHAR_B_UPPER,
  CHAR_F_UPPER,
  KEY_TOSTRING,
  OPEN_PAREN,
  CLOSE_PAREN,
  OPEN_BRACE,
  CLOSE_BRACE,
  OPEN_BRACKET,
  CLOSE_BRACKET,
  PERIOD,
  KEY_ITALICS,
  KEY_FONTCOLOR,
  KEY_CONCAT,
  ITALICS_CALL,
  FONTCOLOR_CALL,
  CHAR_LT,
  CHAR_GT,
  CHAR_SLASH,
  CHAR_EQ,
  CHAR_DQUOTE,
  CHAR_COMMA,
  ...TOSTRING_LETTERS,
];

export default TIER3;
