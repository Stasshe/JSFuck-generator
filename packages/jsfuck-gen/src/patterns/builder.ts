// JSFuck expression building utilities
// All expressions evaluate to their described values in Node.js/browser JS

// Primitive coerced string forms
export const FALSE_STR = "(![]+[])"; // "false"
export const TRUE_STR = "(!![]+[])"; // "true"
export const UNDEF_STR = "([][+[]]+[])"; // "undefined"
export const NAN_STR = "(+{}+[])"; // "NaN"
export const INF_STR = "(1/0+[])"; // "Infinity"
export const OBJ_STR = "([]+{})"; // "[object Object]"
export const EMPTY_STR = "([]+[])"; // ""

// Number n as JSFuck expression (evaluates to a JS number)
export function numExpr(n: number): string {
  if (n === 0) return "+[]";
  if (n === 1) return "+!![]";
  return Array(n).fill("(!![])").join("+");
}

// Build the "fill" key expression: "fill"
const _f = `(![]+[])[+[]]`; // f
const _i = `([][+[]]+[])[5]`; // i
const _l = `(![]+[])[2]`; // l
export const FILL_KEY = `${_f}+${_i}+${_l}+${_l}`;

// "function fill() { [native code] }"
export const FILL_FN_STR = `([][${FILL_KEY}]+[])`;
// Indices: f(0)u(1)n(2)c(3)t(4)i(5)o(6)n(7) (8)f(9)i(10)l(11)l(12)((13))(14) (15){(16) (17)[(18)n(19)a(20)t(21)i(22)v(23)e(24) (25)c(26)o(27)d(28)e(29)](30) (31)}(32)

// Bootstrap chars needed to build "constructor"
export const _c = `${FILL_FN_STR}[3]`; // c
export const _o = `${FILL_FN_STR}[6]`; // o

// All tier-1 chars used in "constructor"
const _n = `([][+[]]+[])[1]`; // n
const _s = `(![]+[])[3]`; // s
const _t = `(!![]+[])[+[]]`; // t
const _r = `(!![]+[])[1]`; // r
const _u = `(!![]+[])[2]`; // u

// "constructor" key expression
export const CONSTR_KEY = `${_c}+${_o}+${_n}+${_s}+${_t}+${_r}+${_u}+${_c}+${_t}+${_o}+${_r}`;

// "function String() { [native code] }"
export const STR_CTOR_FN_STR = `(""+([]+[])[${CONSTR_KEY}])`;
// Indices: f(0)u(1)n(2)c(3)t(4)i(5)o(6)n(7) (8)S(9)t(10)r(11)i(12)n(13)g(14)((15))(16) ...

export const _g = `${STR_CTOR_FN_STR}[14]`; // g
export const _S_upper = `${STR_CTOR_FN_STR}[9]`; // S (uppercase)

// "toString" key expression: t+o+S+t+r+i+n+g  (S is uppercase — camelCase method name)
export const TOSTRING_KEY = `${_t}+${_o}+${_S_upper}+${_t}+${_r}+${_i}+${_n}+${_g}`;

// Number 36 as toString radix.
// JS coerces the string argument to number, and digit literals 5-9 are already
// accepted elsewhere in the dictionary, so keep this compact instead of
// expanding it to 36 boolean additions.
export const BASE36 = '"36"';

// Letter via toString(36): n must be 10..35 for a..z
export function letterExpr(n: number): string {
  return `(${numExpr(n)})[${TOSTRING_KEY}](${BASE36})`;
}

// Function constructor expression
export const FUNC_KEY = `${FILL_FN_STR}[3]+${_o}+${_n}+${_s}+${_t}+${_r}+${_u}+${_c}+${_t}+${_o}+${_r}`;
export const FUNC_CTOR = `[][${FILL_KEY}][${FUNC_KEY}]`;

// Execute a code string via Function constructor
// codeStr must be a JSFuck expression that evaluates to a JS string
export function funcEval(codeStr: string): string {
  return `${FUNC_CTOR}(${codeStr})()`;
}

// Build a string literal from an array of char JSFuck expressions
export function buildStr(charExprs: string[]): string {
  return charExprs.join("+");
}

// ===== Tier 4 helpers =====

const _p = letterExpr(25); // p — (25).toString(36) = "p"

// "return escape" as JSFuck string expression
export const RETURN_ESCAPE_STR = [
  `(!![]+[])[1]`, // r
  `(![]+[])[4]`, // e
  `(!![]+[])[+[]]`, // t
  `(!![]+[])[2]`, // u
  `(!![]+[])[1]`, // r
  `([][+[]]+[])[1]`, // n
  `([]+{})[7]`, // space
  `(![]+[])[4]`, // e
  `(![]+[])[3]`, // s
  `${FILL_FN_STR}[3]`, // c
  `(![]+[])[1]`, // a
  _p, // p
  `(![]+[])[4]`, // e
].join("+");

// "return unescape" as JSFuck string expression
export const RETURN_UNESCAPE_STR = [
  `(!![]+[])[1]`, // r
  `(![]+[])[4]`, // e
  `(!![]+[])[+[]]`, // t
  `(!![]+[])[2]`, // u
  `(!![]+[])[1]`, // r
  `([][+[]]+[])[1]`, // n
  `([]+{})[7]`, // space
  `(!![]+[])[2]`, // u
  `([][+[]]+[])[1]`, // n
  `(![]+[])[4]`, // e
  `(![]+[])[3]`, // s
  `${FILL_FN_STR}[3]`, // c
  `(![]+[])[1]`, // a
  _p, // p
  `(![]+[])[4]`, // e
].join("+");

// escape function: Function("return escape")()
export const ESCAPE_FN = funcEval(RETURN_ESCAPE_STR);

// unescape function: Function("return unescape")()
export const UNESCAPE_FN = funcEval(RETURN_UNESCAPE_STR);

// '%' from escape(' ')[0]
export const PERCENT_EXPR = `(${ESCAPE_FN})(([]+{})[7])[+[]]`;

// Build unescape expression for a char given its hex code string
// hexChars: array of char JSFuck expressions that form the hex portion (2 chars after %)
export function unescapeCharExpr(hexChar1Expr: string, hexChar2Expr: string): string {
  const percentAndHex = `${PERCENT_EXPR}+${hexChar1Expr}+${hexChar2Expr}`;
  return `(${UNESCAPE_FN})(${percentAndHex})`;
}
