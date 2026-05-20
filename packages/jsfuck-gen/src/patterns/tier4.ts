import type { Pattern } from "../types.js";

// Tier 4: difficulty 4~5
// escape/unescape 経由の文字。Prerequisite: func_ctor, tier3 uppercase

// ===== return_escape_str: "return escape" 文字列式 =====
const RETURN_ESCAPE_STR_EXPR = [
  `(!![]+[])[1]`,         // r
  `(![]+[])[4]`,          // e
  `(!![]+[])[+[]]`,       // t
  `(!![]+[])[2]`,         // u
  `(!![]+[])[1]`,         // r
  `([][+[]]+[])[1]`,      // n
  `([]+{})[7]`,           // space
  `(![]+[])[4]`,          // e
  `(![]+[])[3]`,          // s
  `@{char_c}`,            // c
  `(![]+[])[1]`,          // a
  `@{char_p}`,            // p
  `(![]+[])[4]`,          // e
].join("+");

// return_unescape_str
const RETURN_UNESCAPE_STR_EXPR = [
  `(!![]+[])[1]`,         // r
  `(![]+[])[4]`,          // e
  `(!![]+[])[+[]]`,       // t
  `(!![]+[])[2]`,         // u
  `(!![]+[])[1]`,         // r
  `([][+[]]+[])[1]`,      // n
  `([]+{})[7]`,           // space
  `(!![]+[])[2]`,         // u
  `([][+[]]+[])[1]`,      // n
  `(![]+[])[4]`,          // e
  `(![]+[])[3]`,          // s
  `@{char_c}`,            // c
  `(![]+[])[1]`,          // a
  `@{char_p}`,            // p
  `(![]+[])[4]`,          // e
].join("+");

// char_p: (25).toString(36) = "p"
// この deps は key_tostring, base36 に依存するため tier3 以降
const CHAR_P: Pattern = {
  id: "char_p",
  output: "p",
  role: "char_p",
  expression: `((!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![]+!![])[@{key_tostring}](@{base36}))`,
  deps: ["key_tostring", "base36"],
  pure: true,
  kind: "jsfuck",
  tags: ["tier4", "tostring36"],
  description: "(25).toString(36) = p",
};

const RETURN_ESCAPE_STR: Pattern = {
  id: "return_escape_str",
  output: "return escape",
  role: "return_escape_str",
  expression: RETURN_ESCAPE_STR_EXPR,
  deps: ["char_c", "char_p"],
  pure: true,
  kind: "subexpr",
  tags: ["tier4", "eval_str"],
  description: '"return escape" as JSFuck string — used to obtain escape fn via Function()',
};

const RETURN_UNESCAPE_STR: Pattern = {
  id: "return_unescape_str",
  output: "return unescape",
  role: "return_unescape_str",
  expression: RETURN_UNESCAPE_STR_EXPR,
  deps: ["char_c", "char_p"],
  pure: true,
  kind: "subexpr",
  tags: ["tier4", "eval_str"],
  description: '"return unescape" as JSFuck string — used to obtain unescape fn via Function()',
};

// escape_fn: Function("return escape")()
const ESCAPE_FN: Pattern = {
  id: "escape_fn",
  output: "escape",
  role: "escape_fn",
  expression: `@{func_ctor}(@{return_escape_str})()`,
  deps: ["func_ctor", "return_escape_str"],
  pure: true,
  kind: "subexpr",
  tags: ["tier4", "fn"],
  description: 'Function("return escape")() = escape function',
};

// unescape_fn: Function("return unescape")()
const UNESCAPE_FN: Pattern = {
  id: "unescape_fn",
  output: "unescape",
  role: "unescape_fn",
  expression: `@{func_ctor}(@{return_unescape_str})()`,
  deps: ["func_ctor", "return_unescape_str"],
  pure: true,
  kind: "subexpr",
  tags: ["tier4", "fn"],
  description: 'Function("return unescape")() = unescape function',
};

// percent: escape(' ')[0] = '%'
const PERCENT: Pattern = {
  id: "percent_expr",
  output: "%",
  role: "percent_expr",
  expression: `(@{escape_fn})(([]+{})[7])[+[]]`,
  deps: ["escape_fn"],
  pure: true,
  kind: "subexpr",
  tags: ["tier4", "symbol_expr"],
  description: "escape(' ')[0] = '%'",
};

// unescape("%XX") によって文字を得るパターンを生成
function makeUnescapePattern(
  id: string,
  output: string,
  hex1Expr: string,
  hex2Expr: string,
  extraDeps: string[],
  description: string,
): Pattern {
  return {
    id,
    output,
    role: id,
    expression: `(@{unescape_fn})(@{percent_expr}+${hex1Expr}+${hex2Expr})`,
    deps: ["unescape_fn", "percent_expr", ...extraDeps],
    pure: true,
    kind: "jsfuck",
    tags: ["tier4", "unescape"],
    description,
  };
}

// Hex digit 式（tier1 算術 + tier3 uppercase）
// 0-4: pure arithmetic, 5-9: via role (digit_5 等)
const H: Record<string, string> = {
  "0": "+[]+[]",
  "1": "+!![]+[]",
  "2": "!![]+!![]+[]",
  "3": "!![]+!![]+!![]+[]",
  "4": "!![]+!![]+!![]+!![]+[]",
  "5": "@{digit_5}",
  "6": "@{digit_6}",
  "7": "@{digit_7}",
  "8": "@{digit_8}",
  "9": "@{digit_9}",
  // A-F: tier3 uppercase
  A: `@{char_A_upper}`,
  B: `@{char_B_upper}`,
  // C, D, E: unescape bootstrap (%43, %44, %45)
  C: `@{t4_C_upper}`,
  D: `@{t4_D_upper}`,
  E: `@{t4_E_upper}`,
  F: `@{char_F_upper}`,
};

function hexDeps(h1: string, h2: string): string[] {
  const deps: string[] = [];
  const addDep = (h: string) => {
    if (h === "5") deps.push("digit_5");
    else if (h === "6") deps.push("digit_6");
    else if (h === "7") deps.push("digit_7");
    else if (h === "8") deps.push("digit_8");
    else if (h === "9") deps.push("digit_9");
    else if (h === "A") deps.push("char_A_upper");
    else if (h === "B") deps.push("char_B_upper");
    else if (h === "C") deps.push("t4_C_upper");
    else if (h === "D") deps.push("t4_D_upper");
    else if (h === "E") deps.push("t4_E_upper");
    else if (h === "F") deps.push("char_F_upper");
  };
  addDep(h1);
  addDep(h2);
  return [...new Set(deps)];
}

function getHex(k: string): string {
  const v = H[k];
  if (v === undefined) throw new Error(`Missing hex expr for: ${k}`);
  return v;
}

// Bootstrap: C, D, E — hex コードが 0-4 のみで構成されるため依存なし
const BOOTSTRAP_C = makeUnescapePattern(
  "t4_C_upper", "C", getHex("4"), getHex("3"), [],
  "unescape('%43') = C",
);
const BOOTSTRAP_D = makeUnescapePattern(
  "t4_D_upper", "D", getHex("4"), getHex("4"), [],
  "unescape('%44') = D",
);
const BOOTSTRAP_E = makeUnescapePattern(
  "t4_E_upper", "E", getHex("4"), getHex("5"), ["digit_5"],
  "unescape('%45') = E",
);

// Symbols: hex コードが 2X, 3X
const DIGIT_ONLY_SYMBOLS: Array<[string, string, string, string]> = [
  ["t4_excl", "!", "2", "1"],
  ["t4_hash", "#", "2", "3"],
  ["t4_dollar", "$", "2", "4"],
  ["t4_percent_char", "%", "2", "5"],
  ["t4_amp", "&", "2", "6"],
  ["t4_squote", "'", "2", "7"],
  ["t4_star", "*", "2", "A"],
  ["t4_plus", "+", "2", "B"],
  ["t4_comma_unescape", ",", "2", "C"],
  ["t4_minus", "-", "2", "D"],
  ["t4_slash_unescape", "/", "2", "F"],
  ["t4_colon", ":", "3", "A"],
  ["t4_semi", ";", "3", "B"],
  ["t4_lt_unescape", "<", "3", "C"],
  ["t4_eq_unescape", "=", "3", "D"],
  ["t4_gt_unescape", ">", "3", "E"],
  ["t4_quest", "?", "3", "F"],
  ["t4_at_char", "@", "4", "0"],
];

const UPPERCASE_HEX: Array<[string, string, string, string]> = [
  ["t4_G_upper", "G", "4", "7"],
  ["t4_H_upper", "H", "4", "8"],
  ["t4_J_upper", "J", "4", "A"],
  ["t4_K_upper", "K", "4", "B"],
  ["t4_L_upper", "L", "4", "C"],
  ["t4_M_upper", "M", "4", "D"],
  ["t4_P_upper", "P", "5", "0"],
  ["t4_Q_upper", "Q", "5", "1"],
  ["t4_R_upper", "R", "5", "2"],
  ["t4_T_upper", "T", "5", "4"],
  ["t4_U_upper", "U", "5", "5"],
  ["t4_V_upper", "V", "5", "6"],
  ["t4_W_upper", "W", "5", "7"],
  ["t4_X_upper", "X", "5", "8"],
  ["t4_Y_upper", "Y", "5", "9"],
  ["t4_Z_upper", "Z", "5", "A"],
];

const MORE_SYMBOLS: Array<[string, string, string, string]> = [
  ["t4_backslash", "\\", "5", "C"],
  ["t4_caret", "^", "5", "E"],
  ["t4_underscore", "_", "5", "F"],
  ["t4_backtick", "`", "6", "0"],
  ["t4_pipe", "|", "7", "C"],
  ["t4_tilde", "~", "7", "E"],
];

function buildPatterns(entries: Array<[string, string, string, string]>): Pattern[] {
  return entries.map(([id, output, h1, h2]) => {
    const extraDeps = hexDeps(h1, h2).filter((d) => d !== id);
    return makeUnescapePattern(
      id, output, getHex(h1), getHex(h2), extraDeps,
      `unescape("%${h1}${h2}") = "${output}"`,
    );
  });
}

const TIER4: Pattern[] = [
  CHAR_P,
  RETURN_ESCAPE_STR,
  RETURN_UNESCAPE_STR,
  ESCAPE_FN,
  UNESCAPE_FN,
  PERCENT,
  BOOTSTRAP_C,
  BOOTSTRAP_D,
  BOOTSTRAP_E,
  ...buildPatterns(DIGIT_ONLY_SYMBOLS),
  ...buildPatterns(UPPERCASE_HEX),
  ...buildPatterns(MORE_SYMBOLS),
];

export default TIER4;
