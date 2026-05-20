---

# JSFuck Quiz & Generator 仕様書 v2

## 1. リポジトリ構成

```
/
  packages/
    jsfuck-gen/         # npm package: jsfuck-gen
  apps/
    web/                # Next.js static site → gh pages
  pnpm-workspace.yaml
  package.json
```

---

## 2. `jsfuck-gen`

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
type Difficulty = number

type PatternKind = "jsfuck" | "literal"

type Pattern = {
  id: string
  output: string          // 評価済みキャッシュ。vitestで expression と照合して保証する
  expression: string
  kind: PatternKind
  tags: string[]
  trapFor: string[]       // 混同しやすい patternId の一覧
  requires: string[]      // 依存する patternId の一覧
  description?: string
}

type GeneratorConfig = {
  difficulty: Difficulty       // 目標値。厳密な上限ではない
  allowLiteral: boolean
  rng?: () => number      // 省略時は Math.random
}

type QuizConfig = {
  difficulty: Difficulty       // 目標値。厳密な上限ではない
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
  actualDifficulty: Difficulty   // tier * length の合計。目標値に最も近い採用結果
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

パターンは取得経路の複雑さによって4つのTierに分類される。パターン単体には `difficulty` を持たせず、`tierN` タグから tier を推定する。

```
Tier 1
  基本リテラル文字列（false/true/undefined/NaN/Infinity）への
  直接indexingで取れる文字。
  取れる文字: a d e f i I l n N r s t u y 0~9

Tier 2
  toString(36) による小文字。
  ただし Tier 1 で短く取れる a d e f i l n r s t u は登録しない。
  radix の 36 は JS の引数ToNumberに任せ、短い文字列式 `"36"` で渡す。
  前提: "fill" 経由で Function を取得し、"toString" 文字列を構築できること。

Tier 3
  Function コンストラクタ経由で取れる大文字・記号。
  前提: Tier 2 が使える状態。

Tier 4
  escape/unescape・関数のtoString表現・浮動小数点など特殊経路。
  対象: ASCII記号全般・制御文字。
  前提: Tier 3 が使える状態。
```

### 3.2 literalパターン

取得経路がない文字、またはフォールバックとして登録する文字列リテラルパターン。

```
kind: "literal"
tags: ["literal", "fallback"]
```

### 3.3 辞書の整合性制約

vitestで以下を保証する。

- `expression` を評価した結果が `output` と一致する
- `requires` に列挙した `patternId` がすべて辞書に存在する
- `requires` に含まれるパターンの算出難易度が自身の算出難易度以下である
- `trapFor` に列挙した `patternId` がすべて辞書に存在する
- `id` が辞書全体で一意である
- 循環依存が存在しない

---

## 4. 生成エンジン

### 4.1 セグメンテーションDP

入力文字列 `s`（長さ `n`）に対して、セグメンテーションを動的計画法で求める。まず最短コストを前向き・後ろ向きに計算し、復元時に「最短 + 予算」内へ収まる候補から乱択する。これにより、出力は短く保ちつつ、同じ入力でも複数の答えが出る。

`difficulty` は候補の絶対上限ではなく目標値として扱う。生成は最大 10 attempts 行い、`actualDifficulty` が許容誤差内に入った結果を採用する。10 attempts で許容誤差内の結果がなければ、その中で誤差が最小の結果を成功として返す。

```
MAX_DIFFICULTY = 20
DIFFICULTY_TOLERANCE = 1
DIFFICULTY_ATTEMPTS = 10

difficultyError(actual, target):
  below = max(0, target - DIFFICULTY_TOLERANCE - actual)
  above =
    target >= MAX_DIFFICULTY
      ? 0
      : max(0, actual - target - DIFFICULTY_TOLERANCE)
  return below + above
```

`difficulty = MAX_DIFFICULTY` のときは、+方向の誤差を無限に許容する。つまり上に外れた結果は difficulty error 0 として扱う。

```
prefixCost[i] = s[0..i) を表現する最小式長
suffixCost[i] = s[i..n) を表現する最小式長
prefixCost[0] = 0
suffixCost[n] = 0
rawCandidates =
  patterns
    .filter(p => p.output === segment)
    .filter(p => config.allowLiteral || p.kind !== "literal")

minLength = min(rawCandidates.map(p => p.expression.length))
maxLength = max(minLength + 24, ceil(minLength * 1.8))
candidates = rawCandidates.filter(p => p.expression.length <= maxLength)

minCost = prefixCost[n]
maxCost = minCost + max(24, ceil(minCost * 0.25))

復元時:
  choices = candidates(s[pos..j)) のうち
            usedCost + p.expression.length + suffixCost[j] <= maxCost
            を満たすもの
  weight(p) = 1 / p.expression.length
  choices から rng で重み付き選択する

MAX_SEG = 8   // セグメント長の上限。辞書の最大output長に合わせる
```

選ばれた `{ j, pattern }` を順に `GeneratedPart[]` へ追加する。

### 4.2 パターン候補

各セグメントに対する候補フィルタリング：

```
candidates =
  patterns
    .filter(p => p.output === segment)
    .filter(p => config.allowLiteral || p.kind !== "literal")
```

候補が複数ある場合でも、式長が最短候補から大きく離れるものは生成時に使わない。これにより、高難易度で `toString(36)` などの長い別経路が解禁されても、既に短く表現できる文字が過剰に長い式へ置き換わることを防ぐ。

生成時には、既存パターンを直接変更せず、名前付きの同値変形ルールで候補を展開する。長さ上限は通常候補と同じ `boundedVarietyPool` で制限する。

同値変形ルールの例：

```
primitive-source:
  (![]+[])      <=> (!+!![]+[])       // false string
  (!![]+[])     <=> (!+[]+[])         // true string
  ([][+[]]+[])  <=> ([][[]]+[])       // undefined string
  (+{}+[])      <=> (+[{}]+[])        // NaN string
  (1/0+[])      <=> (+!![]/+[]+[])    // Infinity string

numeric-index:
  [0] <=> [+[]] <=> [+![]] <=> [[]-[]]
  [1] <=> [+!![]] <=> [+!+[]]
  [n] <=> [!![]+...+!![]]             // n = 2..9

arithmetic-atom:
  1/0 <=> +!![]/+[]

paren:
  expr <=> (expr)
```

このレイヤは tier1〜4 の辞書不足を直接埋めるものではなく、辞書に登録された各到達経路から同値な式の族を作るためのもの。新しい primitive source や constructor source が増えた場合は、パターン辞書ではなくこの同値変形ルールにも追加する。

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

生成結果の `actualDifficulty` は以下で算出する。

```
partDifficulty(part) = patternTier(part.pattern) * part.segment.length
actualDifficulty = sum(partDifficulty(part))
```

`patternTier` は `tier1`〜`tier4` タグから決定する。literal は tier 5 として扱う。

### 5.2 クイズ品質チェック

Quiz生成時、`actualDifficulty` と target difficulty の差分が許容誤差内であることを確認する。許容誤差内の結果が 10 attempts で得られない場合は、attempts の中で `difficultyError` が最小のものを返す。

```
difficultyError(actualDifficulty, targetDifficulty) === 0
```

ただし `targetDifficulty` が最大値（20）の場合、上方向の誤差は無制限に許容する。下方向は通常どおり `DIFFICULTY_TOLERANCE` を適用する。

収まらない場合は再生成する。最大試行回数は `DIFFICULTY_ATTEMPTS = 10`。超過した場合でも、成功した attempt があれば `difficultyError` が最小の `QuizResult.ok: true` を返す。成功 attempt がひとつもない場合だけ `QuizResult.ok: false` を返す。

---

## 6. Quiz生成

### 6.1 出力文字列の決定

`config.length` が指定されない場合、`difficulty` から文字数レンジを決定する。

```
difficulty 1~2:   1~2文字
difficulty 3~5:   1~3文字
difficulty 6~10:  2~5文字
difficulty 11~:   4~10文字
```

レンジ内でランダムに決定する。

### 6.2 出題文字列の生成

パターン辞書から `patternDifficulty(pattern) <= config.difficulty` かつ `kind !== "literal"` (allowLiteralに従う) のパターンを候補にし、出力文字列をランダムに構築する。

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
difficulty: integer slider 1~20
length: 省略可能（空欄で自動決定）
allowLiteral: toggle
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
difficulty: integer slider 1~20
allowLiteral: toggle
Generate ボタン
```

**出力:**

```
生成されたJSFuck式（コピーボタン付き）
output文字列
actualDifficulty
Breakdown テーブル
未対応文字の一覧（エラー時）
```

### 7.5 Pattern Viewer

登録済みパターンの一覧表示。

```
フィルター: output文字 / difficulty範囲 / tags / kind
表示項目: id / output / expression / kind / tier / difficulty / tags / trapFor / requires / description
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

### 8.1 `jsfuck-gen`

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
  DPセグメンテーションの正確性
  難易度計算の検証
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
