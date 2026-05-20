わかった。では書く。

---

# JSFuck Quiz & Generator 仕様書 v2

## 1. リポジトリ構成

```
/
  packages/
    jsfuck-gen/         # npm package: @roughfts/jsfuck-gen
  apps/
    web/                # Next.js static site → gh pages
  pnpm-workspace.yaml
  package.json
```

---

## 2. `@roughfts/jsfuck-gen`

### 2.1 概要

JSFuck式の生成・評価・クイズ生成を担うコアライブラリ。パターン辞書・生成エンジン・品質評価器をすべて含む。

### 2.2 公開API

```ts
// 生成
generate(input: string, config: GeneratorConfig): GenerateResult

// クイズ生成
generateQuiz(config: QuizConfig): QuizResult

// パターン辞書の参照
getPatterns(filter?: PatternFilter): Pattern[]
getSiblings(patternId: string): Pattern[]
```

### 2.3 型定義

```ts
type Difficulty = number  // float 1.0~5.0

type PatternKind = "jsfuck" | "literal"

type Pattern = {
  id: string
  output: string          // 評価済みキャッシュ。vitestで expression と照合して保証する
  expression: string
  kind: PatternKind
  difficulty: Difficulty
  weight: number
  cost: number            // expression.length を基本とする
  tags: string[]
  trapFor: string[]       // 混同しやすい patternId の一覧
  requires: string[]      // 依存する patternId の一覧
  description?: string
}

type SelectStrategy = "random" | "shortest" | "readable"

type GeneratorConfig = {
  difficulty: Difficulty
  strategy: SelectStrategy
  allowLiteral: boolean
  rng?: () => number      // 省略時は Math.random
}

type QuizConfig = {
  difficulty: Difficulty
  strategy: SelectStrategy
  allowLiteral: boolean
  length?: number         // 省略時は difficulty から決定
  rng?: () => number
}

type GeneratedPart = {
  segment: string         // このパーツが表す出力文字列
  pattern: Pattern
}

type GenerateSuccess = {
  ok: true
  output: string
  expression: string
  parts: GeneratedPart[]
  totalCost: number
  actualDifficulty: Difficulty   // 評価関数が算出した実効難易度
}

type GenerateFailure = {
  ok: false
  reason: "unsupported_chars" | "no_candidates" | "generation_failed"
  unsupportedChars?: string[]
}

type GenerateResult = GenerateSuccess | GenerateFailure

type QuizResult =
  | { ok: true; question: QuizQuestion }
  | { ok: false; reason: string }

type QuizQuestion = {
  expression: string
  answer: string
  actualDifficulty: Difficulty
  parts: GeneratedPart[]
  totalCost: number
}

type PatternFilter = {
  output?: string
  difficulty?: { min?: Difficulty; max?: Difficulty }
  tags?: string[]
  kind?: PatternKind
}
```

---

## 3. パターン辞書

### 3.1 Tier構造

パターンは取得経路の複雑さによって4つのTierに分類される。Tierは難易度レンジに対応する。

```
Tier 1  difficulty 1.0~1.5
  基本リテラル文字列（false/true/undefined/NaN/Infinity）への
  直接indexingで取れる文字。
  取れる文字: a d e f i I l n N r s t u y 0~9

Tier 2  difficulty 1.5~2.5
  toString(36) による小文字全26文字。
  前提: "fill" 経由で Function を取得し、"toString" 文字列を構築できること。

Tier 3  difficulty 2.5~3.5
  Function コンストラクタ経由で取れる大文字・記号。
  前提: Tier 2 が使える状態。

Tier 4  difficulty 3.5~5.0
  escape/unescape・関数のtoString表現・浮動小数点など特殊経路。
  対象: ASCII記号全般・制御文字。
  前提: Tier 3 が使える状態。
```

### 3.2 literalパターン

取得経路がない文字、またはフォールバックとして登録する文字列リテラルパターン。

```
kind: "literal"
difficulty: 0.5
weight: 1
tags: ["literal", "fallback"]
```

### 3.3 辞書の整合性制約

vitestで以下を保証する。

- `expression` を評価した結果が `output` と一致する
- `requires` に列挙した `patternId` がすべて辞書に存在する
- `requires` に含まれるパターンの `difficulty` が自身の `difficulty` 以下である
- `trapFor` に列挙した `patternId` がすべて辞書に存在する
- `id` が辞書全体で一意である
- 循環依存が存在しない

---

## 4. 生成エンジン

### 4.1 セグメンテーションDP

入力文字列 `s`（長さ `n`）に対して、コストが最適なセグメンテーションを動的計画法で求める。

```
dp[i] = s[0..i) を表現する最小コスト
dp[0] = 0
dp[i] = min over j in [max(0, i-MAX_SEG), i) of:
          dp[j] + cost(bestPattern(s[j..i), config))

MAX_SEG = 8   // セグメント長の上限。辞書の最大output長に合わせる
```

`choice[i] = { j, pattern }` を同時に記録し、復元時に `GeneratedPart[]` を構築する。

### 4.2 パターン選択

各セグメントに対する候補フィルタリング：

```
candidates =
  patterns
    .filter(p => p.output === segment)
    .filter(p => p.difficulty <= config.difficulty)
    .filter(p => config.allowLiteral || p.kind !== "literal")
```

戦略ごとの選択：

```
shortest:
  candidates のうち cost が最小のものを選ぶ。
  同コストが複数ある場合は weight で重み付きランダム選択。

readable:
  tags に "readable" を含む候補を優先する。
  該当がなければ weight で重み付きランダム選択。

random:
  weight で重み付きランダム選択。
```

`shortest` では、`effectiveCost` を擬似コストとして DPに統一する。

```
effectiveCost(pattern, strategy) =
  strategy === "shortest"  ? pattern.cost
  strategy === "random"    ? pattern.cost / pattern.weight   // weightが高いほど選ばれやすい
  strategy === "readable"  ? pattern.tags.includes("readable")
                               ? pattern.cost * 0.5
                               : pattern.cost
```

### 4.3 候補がない場合

`allowLiteral: true` のとき、literalパターンで補完する。

`allowLiteral: false` のとき、`GenerateFailure` を返す。

```
reason: "unsupported_chars"
unsupportedChars: 候補がなかった文字の一覧
```

---

## 5. 品質評価器

### 5.1 実効難易度の計算

生成結果の `actualDifficulty` を以下のスコアリングで算出する。

```
actualDifficulty =
  0.4 * avgPatternDifficulty(parts)
+ 0.2 * structuralDepth(parts)
+ 0.3 * trapDensity(parts)
+ 0.1 * segmentDiversity(parts)
```

各項の定義：

```
avgPatternDifficulty:
  parts の difficulty の平均。

structuralDepth:
  parts の requires の最大深さ。
  依存グラフをDFSして最大深さを返す。
  1.0~5.0 にnormalizeする。

trapDensity:
  parts のうち、他パターンの trapFor に含まれるものの割合。
  0.0~1.0 を 1.0~5.0 にスケールする。

segmentDiversity:
  parts のセグメント長の分布のエントロピー。
  全部1文字なら低く、長短混在なら高い。
  1.0~5.0 にnormalizeする。
```

重みは定数として外部に切り出し、調整可能にする。

### 5.2 クイズ品質チェック

Quiz生成時、`actualDifficulty` が以下の範囲に収まることを確認する。

```
[targetDifficulty - 0.5, targetDifficulty + 0.5]
```

収まらない場合は再生成する。最大試行回数は `MAX_QUIZ_ATTEMPTS = 10`。超過した場合は `QuizResult.ok: false` を返す。

---

## 6. Quiz生成

### 6.1 出力文字列の決定

`config.length` が指定されない場合、`difficulty` から文字数レンジを決定する。

```
difficulty 1.0~2.0:  1~2文字
difficulty 2.0~3.0:  2~4文字
difficulty 3.0~4.0:  3~6文字
difficulty 4.0~5.0:  5~10文字
```

レンジ内でランダムに決定する。

### 6.2 出題文字列の生成

パターン辞書から `difficulty <= config.difficulty` かつ `kind !== "literal"` (allowLiteralに従う) のパターンを候補にし、出力文字列をランダムに構築する。

構築した文字列を `generate()` に渡して式を生成する。

### 6.3 回答判定

```
userAnswer === question.answer   // 完全一致。大小文字・空白を区別する
```

---

## 7. `apps/web`

### 7.1 技術構成

```
Next.js (static export → gh pages)
TypeScript
Tailwind CSS
```

状態管理はReact localStateのみ。グローバル状態は持たない。

### 7.2 ページ構成

```
/           トップ。各モードへの導線。
/quiz       Quiz Mode
/generate   Generate Mode
/patterns   Pattern Viewer
```

### 7.3 Quiz Mode

**入力:**

```
difficulty: float slider 1.0~5.0
length: 省略可能（空欄で自動決定）
allowLiteral: toggle
strategy: random / shortest / readable
Generate ボタン
```

**出題:**

```
式を等幅フォントで表示
回答入力欄
Submit ボタン
```

**回答後:**

```
正解 / 不正解
正しい出力文字列
Breakdown テーブル（後述）
actualDifficulty の表示
```

### 7.4 Generate Mode

**入力:**

```
入力文字列（ASCII, 最大100文字）
difficulty: float slider 1.0~5.0
allowLiteral: toggle
strategy: random / shortest / readable
Generate ボタン
```

**出力:**

```
生成されたJSFuck式（コピーボタン付き）
output文字列
totalCost
actualDifficulty
Breakdown テーブル
未対応文字の一覧（エラー時）
```

### 7.5 Pattern Viewer

登録済みパターンの一覧表示。

```
フィルター: output文字 / difficulty範囲 / tags / kind
表示項目: id / output / expression / kind / difficulty / cost / tags / trapFor / requires / description
```

### 7.6 Breakdown テーブル

Quiz・Generate 両モードで共通して表示する。

```
列: segment / expression / difficulty / tags / description
trapFor に含まれるパターンがあれば「混同注意」として行をハイライト
requires の深さに応じてインデント表示
```

---

## 8. デプロイ

### 8.1 `@roughfts/jsfuck-gen`

```
npm publish
public package
```

### 8.2 `apps/web`

```
Next.js static export
gh pages deploy
GitHub Actions で main push 時に自動デプロイ
```

---

## 9. 開発フロー

### 9.1 vitestの責務

```
packages/jsfuck-gen/
  パターン辞書の整合性チェック（全項目）
  generate() の出力検証
  generateQuiz() の出力検証
  weightedRandom の分布検証
  DPセグメンテーションの正確性
  品質評価器のスコアリング
```

### 9.2 実装順序

```
Phase 1: 型定義・パターン辞書（Tier 1）・vitestセットアップ
Phase 2: DPセグメンテーション・パターン選択・generate()
Phase 3: 品質評価器・generateQuiz()
Phase 4: apps/web の全ページ実装
Phase 5: パターン辞書の拡充（Tier 2~4）
Phase 6: npm publish・gh pages デプロイ設定
```

---

## 10. 未対応・将来拡張

初期版では対象外とする。

```
ユーザー投稿によるパターン追加
ログイン・ランキング・履歴の永続保存
Unicode文字列の生成
完全最短化アルゴリズム
seed付きランダム生成（rng注入で将来対応可能な設計にしてある）
```