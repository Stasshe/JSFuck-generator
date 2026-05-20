import type { Pattern } from "../types.js";
import { CONSTR_KEY, FUNC_CTOR, unescapeCharExpr } from "./builder.js";

// Tier 4: difficulty 3.5~5.0
// escape/unescape based character access for remaining ASCII chars
// Prerequisite: Tier 3 (Function constructor, uppercase A, B, F)

// Hex digit char expressions
// Digits 0-9: from tier1
const H: Record<string, string> = {
  "0": "+[]+[]",
  "1": "+!![]+[]",
  "2": "!![]+!![]+[]",
  "3": "!![]+!![]+!![]+[]",
  "4": "!![]+!![]+!![]+!![]+[]",
  "5": '"5"',
  "6": '"6"',
  "7": '"7"',
  "8": '"8"',
  "9": '"9"',
  // A-F uppercase hex digits from tier3
  A: `(""+[][${CONSTR_KEY}])[9]`, // 'A' from Array constructor fn string
  B: `(""+(![])[${CONSTR_KEY}])[9]`, // 'B' from Boolean constructor fn string
  // C: obtained from unescape("%43") — see below
  // D: obtained from unescape("%44")
  // E: obtained from unescape("%45")
  F: `(""+${FUNC_CTOR})[9]`, // 'F' from Function constructor fn string
};

function getHex(k: string): string {
  const v = H[k];
  if (v === undefined) throw new Error(`Missing hex expr for key: ${k}`);
  return v;
}

// Bootstrap: C, D, E need only digit hex codes
const BOOTSTRAP_C = unescapeCharExpr(getHex("4"), getHex("3")); // %43 = 'C'
const BOOTSTRAP_D = unescapeCharExpr(getHex("4"), getHex("4")); // %44 = 'D'
const BOOTSTRAP_E = unescapeCharExpr(getHex("4"), getHex("5")); // %45 = 'E'

H["C"] = BOOTSTRAP_C;
H["D"] = BOOTSTRAP_D;
H["E"] = BOOTSTRAP_E;

// Helper: build unescape pattern
function makeUnescape(
  id: string,
  output: string,
  hex1: string,
  hex2: string,
  extraRequires: string[],
  description: string,
): Pattern {
  const expr = unescapeCharExpr(getHex(hex1), getHex(hex2));
  return {
    id,
    output,
    expression: expr,
    kind: "jsfuck",
    tags: ["tier4", "unescape"],
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
      "t2_bootstrap_g",
      "t2_p",
      ...extraRequires,
    ],
    description,
  };
}

// Symbols with hex codes using only 0-9 in both positions
const DIGIT_ONLY_SYMBOLS: Array<[string, string, string, string]> = [
  ["t4_excl", "!", "2", "1"],
  ["t4_dquote", '"', "2", "2"],
  ["t4_hash", "#", "2", "3"],
  ["t4_dollar", "$", "2", "4"],
  ["t4_percent", "%", "2", "5"],
  ["t4_amp", "&", "2", "6"],
  ["t4_squote", "'", "2", "7"],
  ["t4_star", "*", "2", "A"], // needs A from tier3
  ["t4_plus", "+", "2", "B"], // needs B from tier3
  ["t4_comma", ",", "2", "C"], // needs C (bootstrap)
  ["t4_minus", "-", "2", "D"], // needs D (bootstrap)
  ["t4_slash", "/", "2", "F"], // needs F from tier3
  ["t4_colon", ":", "3", "A"], // needs A
  ["t4_semi", ";", "3", "B"], // needs B
  ["t4_lt", "<", "3", "C"], // needs C
  ["t4_eq", "=", "3", "D"], // needs D
  ["t4_gt", ">", "3", "E"], // needs E
  ["t4_quest", "?", "3", "F"], // needs F
  ["t4_at", "@", "4", "0"],
];

// Uppercase letters C-Z via unescape
const UPPERCASE_HEX: Array<[string, string, string, string]> = [
  ["t4_C_upper", "C", "4", "3"],
  ["t4_D_upper", "D", "4", "4"],
  ["t4_E_upper", "E", "4", "5"],
  ["t4_G_upper", "G", "4", "7"],
  ["t4_H_upper", "H", "4", "8"],
  ["t4_J_upper", "J", "4", "A"], // needs A
  ["t4_K_upper", "K", "4", "B"], // needs B
  ["t4_L_upper", "L", "4", "C"], // needs C (bootstrap)
  ["t4_M_upper", "M", "4", "D"], // needs D (bootstrap)
  ["t4_P_upper", "P", "5", "0"],
  ["t4_Q_upper", "Q", "5", "1"],
  ["t4_R_upper", "R", "5", "2"],
  ["t4_T_upper", "T", "5", "4"],
  ["t4_U_upper", "U", "5", "5"],
  ["t4_V_upper", "V", "5", "6"],
  ["t4_W_upper", "W", "5", "7"],
  ["t4_X_upper", "X", "5", "8"],
  ["t4_Y_upper", "Y", "5", "9"],
  ["t4_Z_upper", "Z", "5", "A"], // needs A
];

// More symbols
const MORE_SYMBOLS: Array<[string, string, string, string]> = [
  ["t4_backslash", "\\", "5", "C"], // needs C
  ["t4_caret", "^", "5", "E"], // needs E
  ["t4_underscore", "_", "5", "F"], // needs F
  ["t4_backtick", "`", "6", "0"],
  ["t4_pipe", "|", "7", "C"], // needs C
  ["t4_tilde", "~", "7", "E"], // needs E
];

function hexRequires(h1: string, h2: string): string[] {
  const deps: string[] = [];
  if (h1 === "A" || h2 === "A") deps.push("t3_A_upper");
  if (h1 === "B" || h2 === "B") deps.push("t3_B_upper");
  if (h1 === "C" || h2 === "C") deps.push("t4_C_upper");
  if (h1 === "D" || h2 === "D") deps.push("t4_D_upper");
  if (h1 === "E" || h2 === "E") deps.push("t4_E_upper");
  if (h1 === "F" || h2 === "F") deps.push("t3_F_upper");
  return deps;
}

function buildPatterns(entries: Array<[string, string, string, string]>): Pattern[] {
  return entries.map(([id, output, h1, h2]) => {
    const hexDeps = hexRequires(h1, h2);
    // Self-referential bootstrap chars don't list themselves as requires
    const filteredDeps = hexDeps.filter(
      (dep) => dep !== id && !(id === "t4_C_upper" && dep === "t4_C_upper"),
    );
    return makeUnescape(
      id,
      output,
      h1,
      h2,
      filteredDeps,
      `unescape("%${h1}${h2}") = "${output}"`,
    );
  });
}

const TIER4: Pattern[] = [
  ...buildPatterns(DIGIT_ONLY_SYMBOLS),
  ...buildPatterns(UPPERCASE_HEX),
  ...buildPatterns(MORE_SYMBOLS),
];

export default TIER4;
