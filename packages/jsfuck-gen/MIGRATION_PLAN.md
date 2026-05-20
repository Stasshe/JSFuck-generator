# Migration Plan: DAG-Based Pattern Resolution

## 目的

現在の「式がすべて静的にインライン展開された唯一解」問題を解決する。
各中間表現（キー文字列・関数文字列）もパターンとして登録し、DP が全体を最適化できるようにする。

---

## 問題の整理

```
現在:
  CONSTR_KEY = (hardcoded expansion of c+o+n+s+t+r+u+c+t+o+r)
  t2_bootstrap_g.expression = (""+([]+[])[CONSTR_KEY])[14]   ← 唯一解・静的

  builder.ts → tier*.ts に一方向依存。
  generator は最終出力文字列のみ最適化し、中間キー式は最適化しない。

目標:
  各中間式も複数候補を持ち、generator が動的に選択する。
  同じ 'g' を生成するのに、constructor を綴る方法が複数あり、
  c や o を取り出す方法も複数ある → 式の多様性が乗算的に増える。
```

---

## 新しいデータ構造

### `Pattern` 型

```ts
export type Pattern = {
  id: string;

  // この式が評価されると得られる JS 文字列値
  // 最終出力パターン: ユーザー入力のセグメントと照合する
  // 中間表現パターン: デバッグ・説明用（DP セグメント照合には使われない）
  output: string;

  // 他のパターンが @{role} で参照するときの識別子
  // 例: "char_f", "fill_fn_str", "key_constructor"
  // 最終出力専用パターンには不要（中間式として使われない場合）
  role?: string;

  // JSFuck 式テンプレート。@{roleName} プレースホルダーを含んでよい
  expression: string;

  // expression 内で参照している role 名の一覧
  // 解決器がこれをもとに依存関係を辿る
  deps?: string[];

  // 代替式テンプレート（同じ意味、異なる JSFuck 表現）
  alternates?: string[];

  // 純粋 JSFuck かどうか（[]()!+ のみ使用）
  // true = strict mode でも使用可
  // false = '"5"' 等のリテラルを含む（非 strict のみ）
  pure: boolean;

  // tier タグ等
  tags: string[];

  // 人間向け説明。dep 解決後に chain として連結可能
  description?: string;
};
```

**削除フィールド**: `trapFor`、`requires`（実エンジンで未使用だったため）

---

### `GeneratorConfig` 型

```ts
export type GeneratorConfig = {
  difficulty: number;

  // true: []()!+ のみのパターン（pure: true）のみ使用
  // false (default): リテラルショートカットも可
  strict?: boolean;

  rng?: () => number;
};
```

**削除**: `allowLiteral`（literal kind パターンごと廃止）

---

### `GeneratedPart` 型（拡張）

```ts
export type Derivation = {
  patternId: string;
  expression: string;          // 完全解決済みの具体的 JSFuck 式
  description: string | undefined;
  deps: Record<string, Derivation>;  // role → 選択された dep の導出木
};

export type GeneratedPart = {
  segment: string;
  pattern: Pattern;
  resolvedExpression: string;  // @{} 解決済みの式
  derivation: Derivation;      // 導出ツリー（説明用）
};
```

---

## パターンの role 分類

### 最終出力パターン（DP がセグメント照合）

| role | output | 説明 |
|------|--------|------|
| `"char_f"` | `"f"` | false[0] |
| `"char_a"` | `"a"` | false[1] |
| … | … | tier1 全文字 |
| `"str_false"` | `"false"` | 複数文字出力 |
| `"str_constructor"` | `"constructor"` | ← NEW: DP が "constructor" を含む入力を最適化 |
| `"str_tostring"` | `"toString"` | ← NEW |
| `"str_fill"` | `"fill"` | ← NEW |

最終出力パターンは role を持っても持たなくてもよいが、
**中間式として他パターンに使われる場合は role が必須**。

---

### 中間表現パターン（DP セグメント照合しない。deps 経由のみ）

| role | output (評価結果) | 説明 |
|------|------------------|------|
| `"key_fill"` | `"fill"` | `f+i+l+l` の式 |
| `"key_at"` | `"at"` | `a+t` の式 |
| `"key_entries"` | `"entries"` | `e+n+t+r+i+e+s` の式 |
| `"key_constructor"` | `"constructor"` | `c+o+n+s+t+r+u+c+t+o+r` の式 |
| `"key_tostring"` | `"toString"` | `t+o+S+t+r+i+n+g` の式 |
| `"key_italics"` | `"italics"` | `i+t+a+l+i+c+s` の式 |
| `"key_fontcolor"` | `"fontcolor"` | `f+o+n+t+c+o+l+o+r` の式 |
| `"key_concat"` | `"concat"` | `c+o+n+c+a+t` の式 |
| `"fill_fn_str"` | `"function fill() { [native code] }"` | `[][key_fill]+[]` |
| `"at_fn_str"` | `"function at() { [native code] }"` | `[][key_at]+[]` |
| `"entries_iter_str"` | `"[object Array Iterator]"` | `[][key_entries]()+[]` |
| `"str_ctor_fn_str"` | `"function String() { [native code] }"` | `(""+([]+[])[key_constructor])` |
| `"num_ctor_fn_str"` | `"function Number() { [native code] }"` | 同上 |
| `"arr_ctor_fn_str"` | `"function Array() { [native code] }"` | 同上 |
| `"func_ctor"` | — | Function コンストラクタ式 |
| `"escape_fn"` | — | `escape` 関数式 |
| `"unescape_fn"` | — | `unescape` 関数式 |
| `"italics_call"` | `"<i></i>"` | `([]+[])[key_italics]()` |
| `"fontcolor_call"` | `'<font color="undefined"></font>'` | `([]+[])[key_fontcolor]()` |

---

## DAG 構造

```
L0 (依存なし)
  char_f, char_a, char_l, char_s, char_e     ← "false" 由来
  char_t, char_r, char_u                     ← "true" 由来
  char_n, char_d, char_i                     ← "undefined" 由来
  char_N_upper, char_I_upper, char_y, char_O_upper
  digit_0..4 (arithmetic)
  str_false, str_true, str_nan, str_infinity, str_undefined

L1 (deps: L0 chars)
  key_fill     deps: char_f, char_i, char_l
  key_at       deps: char_a, char_t
  key_entries  deps: char_e, char_n, char_t, char_r, char_i, char_s

L2 (deps: L1 keys)
  fill_fn_str         deps: key_fill
  at_fn_str           deps: key_at
  entries_iter_str    deps: key_entries

L3 (deps: L2 fn strings)
  char_c    deps: fill_fn_str   ← 複数候補: fill由来, at由来
  char_o    deps: fill_fn_str   ← 複数候補
  char_v    deps: fill_fn_str
  char_b    deps: entries_iter_str
  char_j    deps: entries_iter_str

L4 (deps: L3 chars)
  key_constructor  deps: char_c, char_o, char_n, char_s, char_t, char_r, char_u
  key_italics      deps: char_i, char_t, char_a, char_l, char_c, char_s
  key_fontcolor    deps: char_f, char_o, char_n, char_t, char_c, char_l, char_r
  key_concat       deps: char_c, char_o, char_n, char_a, char_t

L5 (deps: L4 keys)
  str_ctor_fn_str   deps: key_constructor
  num_ctor_fn_str   deps: key_constructor
  arr_ctor_fn_str   deps: key_constructor
  bool_ctor_fn_str  deps: key_constructor
  italics_call      deps: key_italics
  fontcolor_call    deps: key_fontcolor

L6 (deps: L5 fn strings)
  char_g        deps: str_ctor_fn_str
  char_S_upper  deps: str_ctor_fn_str
  char_m        deps: num_ctor_fn_str
  char_A_upper  deps: arr_ctor_fn_str (or entries path)
  char_B_upper  deps: bool_ctor_fn_str

L7 (deps: L6 chars)
  key_tostring  deps: char_t, char_o, char_S_upper, char_t, char_r, char_i, char_n, char_g

L8 (deps: L7 key_tostring)
  letter_b(11).toString(36) .. letter_z(35)

L9 (deps: L8+ chars, func_ctor)
  escape_fn, unescape_fn
  tier4 unescape chars
```

循環なし（有向非巡回グラフ）。

---

## エンジン変更

### 新ファイル: `engine/resolver.ts`

役割: DAG を辿り、`@{role}` プレースホルダーを解決して具体的な式を返す。

```ts
// 解決コンテキスト: 1回の generate 呼び出し内で共有
// キャッシュなし: 同じ role でも毎回別の候補を選べる（多様性優先）
type ResolverCtx = {
  patterns: Pattern[];
  config: GeneratorConfig;
  rng: () => number;
};

function resolve(pattern: Pattern, ctx: ResolverCtx): Derivation {
  if (!pattern.deps || pattern.deps.length === 0) {
    return { patternId: pattern.id, expression: pattern.expression, ... };
  }
  const resolvedDeps: Record<string, Derivation> = {};
  for (const role of pattern.deps) {
    const candidate = pickCandidate(role, ctx);    // boundedVarietyPool と同ロジック
    resolvedDeps[role] = resolve(candidate, ctx);  // 再帰（DAG なので終端する）
  }
  const expression = substituteTemplate(pattern.expression, resolvedDeps);
  return { patternId: pattern.id, expression, deps: resolvedDeps, ... };
}
```

### `engine/dp.ts` 変更

**Pass 1: コスト推定**

DP が各パターンのコストを計算する際、`@{role}` を `minExprLen(role)` で置換した推定長を使う。
`minExprLen` はトポロジカル順で事前計算（O(パターン数)）。

```ts
function estimatedLen(pattern: Pattern, minLens: Map<string, number>): number {
  let len = pattern.expression.length;
  for (const role of (pattern.deps ?? [])) {
    const placeholder = `@{${role}}`.length;  // 置換前の長さ
    const actual = minLens.get(role) ?? 0;
    len += actual - placeholder;
  }
  return len;
}
```

**Pass 2: 実解決**

DP がセグメントを決定した後、各パターンを `resolve()` で具体化。
`resolvedExpression` の長さが `maxCost` 内に収まるか検証。はみ出せば次の候補を試す。

### `engine/selector.ts` 変更

`candidatePatterns` が strict モードを考慮:

```ts
function isEligible(p: Pattern, config: GeneratorConfig): boolean {
  if (config.strict && !p.pure) return false;
  // literal kind は廃止済み
  return patternTier(p) <= config.difficulty;
}
```

---

## パターンデータ変更

### `builder.ts` の縮小

**削除**: すべてのキー定数（`FILL_KEY`, `CONSTR_KEY`, `TOSTRING_KEY`, etc.）
**削除**: すべての式定数（`FILL_FN_STR`, `STR_CTOR_FN_STR`, `FUNC_CTOR`, etc.）
**削除**: `RETURN_ESCAPE_STR`, `RETURN_UNESCAPE_STR`, `ESCAPE_FN`, `UNESCAPE_FN`

**残す**: 純粋なユーティリティ関数のみ
```ts
export function numExpr(n: number): string   // 数値 → JSFuck 数式
export function generateAlternates(expr: string): string[]
// letterExpr は key_tostring への dep で表現できるため削除も検討
```

### `tier1.ts` 変更

- `trapFor` フィールド削除
- `requires` フィールド削除  
- `pure: true` 追加（全 tier1 は算術・プリミティブのみ）
- `role` 追加（例: `char_f`, `str_false`）
- digit 5-9: strict 用パターン追加（pure arithmetic）

```ts
// 非 strict
{ id: "digit_5", output: "5", role: "digit_5", expression: '"5"', pure: false, ... }
// strict（同 role, pure: true）
{ id: "digit_5_strict", output: "5", role: "digit_5",
  expression: "!![]+!![]+!![]+!![]+!![]+[]", pure: true, ... }
```

### `tier2.ts` 変更（大幅）

builder.ts の定数を **中間表現パターン** として tier2 内に明示的に登録。

```ts
// キーパターン（最終出力なし、deps 用のみ）
{
  id: "key_fill_v1",
  output: "fill",
  role: "key_fill",
  expression: "@{char_f}+@{char_i}+@{char_l}+@{char_l}",
  deps: ["char_f", "char_i", "char_l"],
  pure: true,
  tags: ["tier2", "key"],
  description: '"fill" key expression',
},
// fill_fn_str パターン
{
  id: "fill_fn_str_v1",
  output: "function fill() { [native code] }",
  role: "fill_fn_str",
  expression: "([][@{key_fill}]+[])",
  deps: ["key_fill"],
  pure: true,
  tags: ["tier2", "subexpr"],
  description: '[][fill_key]+[] = "function fill() { [native code] }"',
},
// char_c: fill_fn_str 由来
{
  id: "char_c_fill",
  output: "c",
  role: "char_c",
  expression: "(@{fill_fn_str})[3]",
  deps: ["fill_fn_str"],
  pure: true,
  tags: ["tier2", "from_fill_fn"],
  description: '"function fill(){...}"[3] = c',
},
// char_c: at_fn_str 由来（多様性のための別候補）
{
  id: "char_c_at",
  output: "c",
  role: "char_c",
  expression: "(@{at_fn_str})[3]",
  deps: ["at_fn_str"],
  pure: true,
  tags: ["tier2", "from_at_fn"],
  description: '"function at(){...}"[3] = c',
},
```

### `tier3.ts` 変更

同様に key_constructor, str_ctor_fn_str, char_g, char_S_upper, key_tostring を中間表現パターンとして登録。

### `tier4.ts` 変更

escape_fn, unescape_fn を中間表現パターンとして登録。
tier4 各文字パターンは `deps: ["escape_fn"]` or `deps: ["unescape_fn"]` を持つ。

---

## Strict Mode

対象: `pure: false` な式を持つパターン
- `'"5"'` ～ `'"9"'`（digit リテラル）
- `'"36"'`（base36）→ strict 版: `(6 trues) * (6 trues)` = `(!![]+!![]+!![]+!![]+!![]+!![])*(!![] +!![]+!![]+!![]+!![]+!![])`

各パターンに strict 版を追加（same role, `pure: true`）。
`GeneratorConfig.strict = true` 時、`pure: false` パターンは候補から除外。

---

## description 継承

`Derivation` ツリーから連鎖説明文を生成するユーティリティを追加:

```ts
// engine/explain.ts (新規)
export function explainDerivation(d: Derivation): string {
  // 例: 'g = STR_CTOR_FN_STR[14]\n  where STR_CTOR_FN_STR = ...\n    where ...'
}
```

`GenerateSuccess` に `explain(): string` メソッドを追加するか、
`parts[n].derivation` を公開 API とする。

---

## 削除されるもの

| 削除対象 | 理由 |
|----------|------|
| `builder.ts` のキー定数群 | tier*.ts のパターンに移動 |
| `Pattern.trapFor` | 未使用 |
| `Pattern.requires` | `deps` に置換 |
| `GeneratorConfig.allowLiteral` | strict に置換 |
| `kind: "literal"` パターン | literal fallback 廃止 |
| `patterns/index.ts` の literal fallback ループ | 同上 |
| `equivalence.ts`（削除済み） | 削除済み |

---

## ファイル別変更サマリ

```
src/
  types.ts                ← Pattern/Config 型を全面更新
  difficulty.ts           ← pure フラグ考慮、literal tier 削除
  evaluator.ts            ← 変更少（derivation 情報を受け取るように）
  quiz.ts                 ← allowLiteral → strict
  index.ts                ← 公開 API に explain 系追加
  engine/
    resolver.ts           ← NEW: DAG 解決エンジン
    explain.ts            ← NEW: 導出説明生成
    dp.ts                 ← Pass1 コスト推定 + Pass2 実解決
    generator.ts          ← resolver 呼び出し、derivation 収集
    selector.ts           ← strict モード対応
  patterns/
    builder.ts            ← numExpr, generateAlternates のみ残す
    tier1.ts              ← role 追加、pure 追加、strict 版 digit 追加
    tier2.ts              ← 中間表現パターン追加（key_*, *_fn_str, char_c/o 等）
    tier3.ts              ← 中間表現パターン追加（key_constructor, str_ctor_fn_str 等）
    tier4.ts              ← escape/unescape を中間表現パターン化
    index.ts              ← literal fallback ループ削除、subexpr パターンの DP 除外
```

---

## 実装順序

1. `types.ts` — 型を確定
2. `patterns/tier1.ts` — role, pure, strict 版 digit 追加
3. `patterns/tier2.ts` — 中間表現パターン（key_fill, fill_fn_str, char_c/o 多候補）
4. `patterns/tier3.ts` — 中間表現パターン（key_constructor, str_ctor_fn_str, char_g 等）
5. `patterns/tier4.ts` — escape/unescape 中間表現パターン化
6. `patterns/builder.ts` — 定数群削除、ユーティリティのみ残す
7. `patterns/index.ts` — literal ループ削除
8. `engine/resolver.ts` — NEW: DAG 解決
9. `engine/dp.ts` — コスト推定 + 実解決 2 パス
10. `engine/selector.ts` — strict 対応
11. `engine/generator.ts` — derivation 収集
12. `engine/explain.ts` — NEW: 説明生成
13. `difficulty.ts`, `evaluator.ts`, `quiz.ts` — 型変更追従
14. テスト更新・追加

各ステップはビルドが通る状態で完結させる。
