# JSFuck Quiz & Generator 仕様書 v3

## 1. リポジトリ構成

```
/
  packages/
    jsfuck-gen/         # npm package: jsfuck-gen
  apps/
    web/                # Next.js app
  pnpm-workspace.yaml
  package.json
```

## 2. `jsfuck-gen`

### 2.1 概要

JSFuck 式の生成、導出説明、難易度評価、クイズ生成を担うコアライブラリ。

パターン辞書は DAG ベースで管理する。最終出力文字に直接対応するパターンだけでなく、`constructor` や `toString` などの中間表現も `role` 付きパターンとして登録し、生成時に `@{role}` プレースホルダーを解決する。

### 2.2 公開 API

```ts
generate(input: string, config: GeneratorConfig): GenerateResult
generateQuiz(config: QuizConfig): QuizResult

getPatterns(filter?: PatternFilter): Pattern[]
getSiblings(patternId: string): Pattern[]

explainDerivation(derivation: Derivation, indent?: number): string
explainParts(parts: GeneratedPart[]): string

patternTier(pattern: Pattern): number
patternDifficulty(pattern: Pattern): number
partDifficulty(part: GeneratedPart): number
```

`ALL_PATTERNS` もエクスポートする。`getPatterns()` は最終出力用の `kind: "jsfuck"` パターンだけを返す。中間表現を含めて参照したい場合は `ALL_PATTERNS` を使う。

### 2.3 型定義

```ts
type Difficulty = number

type PatternKind = "jsfuck" | "subexpr"

type Pattern = {
  id: string
  output: string
  role?: string
  kind: PatternKind
  expression: string
  strictExpression?: string
  deps?: string[]
  alternates?: string[]
  strictAlternates?: string[]
  pure: boolean
  tags: string[]
  description?: string
}

type GeneratorConfig = {
  difficulty: Difficulty
  strict?: boolean
  rng?: () => number
}

type QuizConfig = {
  difficulty: Difficulty
  strict?: boolean
  length?: number
  rng?: () => number
}

type Derivation = {
  patternId: string
  expression: string
  description: string | undefined
  deps: Record<string, Derivation>
}

type GeneratedPart = {
  segment: string
  pattern: Pattern
  resolvedExpression: string
  derivation: Derivation
}

type GenerateSuccess = {
  ok: true
  output: string
  expression: string
  parts: GeneratedPart[]
  actualDifficulty: Difficulty
}

type GenerateFailure = {
  ok: false
  reason: "unsupported_chars" | "no_candidates" | "generation_failed"
  unsupportedChars?: string[]
}

type GenerateResult = GenerateSuccess | GenerateFailure

type QuizQuestion = {
  expression: string
  answer: string
  actualDifficulty: Difficulty
  parts: GeneratedPart[]
}

type QuizResult =
  | { ok: true; question: QuizQuestion }
  | { ok: false; reason: string }

type PatternFilter = {
  output?: string
  difficulty?: { min?: Difficulty; max?: Difficulty }
  tags?: string[]
  kind?: PatternKind
}
```

### 2.4 Strict mode

`strict: true` の場合は `pure: true` のパターンだけを使う。`pure: true` は `[]()!+` のみで構成できることを表す。

`strictExpression` と `strictAlternates` は、数値添字を JSFuck 式へ展開したテンプレートである。例:

```
[0] -> [+[]]
[1] -> [+!![]]
[2] -> [(!![])+(!![])]
```

`strict: false` または未指定の場合は、数値添字や短いリテラルショートカットを含む `pure: false` パターンも使用できる。

## 3. パターン辞書

### 3.1 PatternKind

```
jsfuck
  DP がユーザー入力のセグメントと照合する最終出力パターン。

subexpr
  他パターンの deps 経由でだけ使う中間表現パターン。
  DP のセグメント照合には使わない。
```

### 3.2 Role と deps

`expression` は `@{role}` プレースホルダーを含んでよい。`deps` はその式が参照する role 名の一覧である。

生成時は resolver が role ごとに候補パターンを選び、再帰的に解決して `Derivation` を作る。同じ role でも呼び出しごとに独立して候補を選ぶため、同じ入力から複数の式が生成される。

### 3.3 Tier 構造

パターンは `tier1` から `tier4` のタグで取得経路の複雑さを表す。パターン単体に `difficulty` フィールドは持たせない。

```
Tier 1
  false / true / undefined / NaN / Infinity などの基本値と直接 indexing。
  数字や基本プリミティブ文字列も含む。

Tier 2
  toString(36) などで得る小文字。
  constructor / toString のキー構築は role/deps 経由で解決する。

Tier 3
  Function コンストラクタや各種 constructor 文字列から得る大文字・記号。

Tier 4
  escape / unescape、HTML 文字列、関数文字列表現など特殊経路。
  printable ASCII 全体の補完を担う。
```

`patternTier(pattern)` は `tier1` から `tier4` タグを読んで `1..4` を返す。該当タグがない場合は `5` として扱う。

### 3.4 Alternate 生成

パターンは手動の `alternates` に加えて、ビルダーが一部の同値変形を自動生成する。

```
numeric index:
  [0] <=> [+[]] <=> [+![]] <=> [[]-[]]
  [1] <=> [+!![]] <=> [+!+[]]
  [n] <=> [!![]+...+!![]]  // n = 2..9

primitive source:
  (![]+[]) <=> (!+!![]+[])
  (!![]+[]) <=> (!+[]+[])
  ([][+[]]+[]) <=> ([][[]]+[])
  (+{}+[]) <=> (+[{}]+[]) <=> ([][[]]+(+[])+[])
  (1/0+[]) <=> (+!![]/+[]+[]) <=> (!+[]/+[]+[])
  ([]+{}) <=> ({}+[])
```

プレースホルダーを含むテンプレートは、現時点では自動 alternate 生成の対象外とする。

### 3.5 辞書の整合性制約

Vitest で以下を保証する。

- `id` が辞書全体で一意である
- `deps` に列挙した role が辞書に存在する
- role 依存に循環が存在しない
- `patternDifficulty(pattern)` が正である
- `pure: true` のパターンは `strictExpression` を持ち、数値添字を含まない
- printable ASCII 文字 `0x20..0x7e` が `kind: "jsfuck"` パターンで少なくとも 1 つ存在する
- プレースホルダーを含まない tier1 の `expression` は評価結果が `output` と一致する

## 4. 生成エンジン

### 4.1 セグメンテーション DP

入力文字列 `s` に対して、推定式長をコストにした DP でセグメンテーションを決める。

`candidatePatterns(segment)` は以下を満たす候補だけを返す。

```
p.kind === "jsfuck"
p.output === segment
patternTier(p) <= config.difficulty
!config.strict || p.pure
```

`strict: true` の場合は `strictExpression` / `strictAlternates` を優先した variant を使う。

### 4.2 推定式長

DP の Pass 1 では、`@{role}` を role ごとの最小推定式長で置換した長さを使う。

```
estimatedExprLength(pattern) =
  expression.length
  - sum("@{role}".length)
  + sum(minLenByRole[role])
```

`minLenByRole` は全パターンを最大 20 pass 走査して収束させる。中間表現パターンは difficulty に関係なく role 解決候補へ含めるが、`strict: true` では `pure: true` のみ使う。

### 4.3 Variety pool

候補は最短式だけに固定しない。セグメントごとに以下の範囲へ収まる候補を採用する。

```
minLength = min(estimatedExprLength(candidate))
maxLength = max(minLength + 24, ceil(minLength * 1.8))
pool = candidates.filter(len <= maxLength)
```

入力全体の復元時も、最短コストに探索予算を加えた範囲で候補を選ぶ。

```
minCost = prefixCost[n]
budget = max(24, ceil(minCost * 0.25))
       + ceil(minCost * 8 * explorationLevel(config.difficulty))
maxCost = minCost + budget

explorationLevel(difficulty) = clamp((difficulty - 5) / 15, 0, 1)
```

低 difficulty では短い式を優先し、高 difficulty では長めの候補も選ばれやすくする。

### 4.4 DAG 解決

DP で選択された各パターンは `resolvePattern()` で解決する。

```
1. expression / strictExpression から @{role} を抽出する
2. role を持つ候補から strict 条件に合うものを選ぶ
3. 候補を再帰的に解決する
4. テンプレート中の @{role} を解決済み expression で置換する
5. Derivation を返す
```

`GeneratedPart.resolvedExpression` はプレースホルダー解決済みの式で、`GenerateSuccess.expression` は各 part を `(...) + (...)` で連結した式である。

### 4.5 失敗時

候補が作れない場合は `GenerateFailure` を返す。

```
reason: "unsupported_chars"
unsupportedChars: その difficulty / strict 条件で候補がない文字の一覧
```

DP 復元または DAG 解決が失敗した場合は `generation_failed` を返す。

空文字列は成功扱いで、`expression: "[]+[]"`、`actualDifficulty: 1.0`、`parts: []` を返す。

## 5. 難易度評価

### 5.1 パターン難易度

```
patternDifficulty(pattern) = patternTier(pattern) * max(1, pattern.output.length)
partDifficulty(part) = patternTier(part.pattern) * part.segment.length
```

### 5.2 実効難易度

生成結果の `actualDifficulty` は、生成された全文字に対する 1 文字あたりの平均難易度である。

```
totalChars = sum(part.segment.length)
actualDifficulty = sum(partDifficulty(part)) / totalChars
```

`parts` が空の場合は `1.0` を返す。

## 6. Quiz 生成

### 6.1 出力文字列の決定

`config.length` が指定されない場合、difficulty から文字数レンジを決定する。

```
difficulty <= 2.0:   1..2 文字
difficulty <= 5.0:   1..3 文字
difficulty <= 10.0:  2..5 文字
difficulty > 10.0:   4..10 文字
```

### 6.2 出題文字列の生成

`getPatterns()` から 1 文字出力のパターンを候補にする。

```
p.output.length === 1
!config.strict || p.pure
patternTier(p) <= config.difficulty
```

候補から `length` 文字をランダムに選んで `generate()` に渡す。

### 6.3 品質チェック

Quiz 生成時は `actualDifficulty` と目標 difficulty の差分を確認する。

```
DIFFICULTY_TOLERANCE = 1
MAX_QUIZ_ATTEMPTS = 10
MAX_DIFFICULTY = 20
```

通常は上下とも許容差 `1` 以内を要求する。ただし `targetDifficulty === 20` の場合、上方向の誤差は許容する。下方向は通常どおり確認する。

### 6.4 回答判定

```
userAnswer === question.answer
```

完全一致。大小文字・空白を区別する。

## 7. `apps/web`

### 7.1 技術構成

```
Next.js
React
TypeScript
Tailwind CSS
```

状態管理は React local state のみ。

### 7.2 ページ構成

```
/           トップ。各モードへの導線
/generate   Generate Mode
/quiz       Quiz Mode
/patterns   Pattern Viewer
```

### 7.3 Generate Mode

入力:

```
input: ASCII, 最大100文字
difficulty: slider 1..20
strict: checkbox
Generate ボタン
```

出力:

```
生成された JSFuck 式
Copy ボタン
output 文字列
actualDifficulty
Breakdown テーブル
未対応文字の一覧
```

### 7.4 Quiz Mode

入力:

```
difficulty: slider 1..20
strict: checkbox
length: 省略可能。1..100 の整数
Generate ボタン
```

出題と回答:

```
式を等幅フォントで表示
answer 入力欄
Submit ボタン
正解 / 不正解
正しい出力文字列
actualDifficulty
Breakdown テーブル
```

### 7.5 Pattern Viewer

登録済みパターンの一覧表示。

```
フィルター: output / min difficulty / max difficulty / tags / kind
表示項目: id / output / expression / kind / tier / difficulty / tags / deps / description
```

Web 側は `ALL_PATTERNS` を表示するため、`jsfuck` と `subexpr` の両方を確認できる。

### 7.6 Breakdown テーブル

Quiz と Generate の共通表示。

```
列: segment / resolvedExpression / difficulty / tags / description
```

`difficulty` は `partDifficulty(part)` を表示する。依存の深さは role/deps から算出し、segment のインデントに反映する。

## 8. 開発・検証

### 8.1 主なコマンド

```
pnpm install
pnpm test
pnpm --dir packages/jsfuck-gen test
pnpm build
pnpm web:dev
pnpm web:build
```

### 8.2 Vitest の責務

```
packages/jsfuck-gen/
  パターン辞書の整合性チェック
  generate() の出力検証
  DAG 解決済み expression の eval 検証
  strict mode の数値添字展開検証
  alternate / variety pool の検証
  generateQuiz() の出力検証
  難易度計算の検証
```

## 9. 未対応・将来拡張

```
ユーザー投稿によるパターン追加
ログイン・ランキング・履歴の永続保存
Unicode 文字列の生成
完全最短化アルゴリズム
プレースホルダー解決後の alternate 再生成
デプロイ自動化の整備
```
