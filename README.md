# JSFuck Generator

JSFuck の式を生成し、生成過程を確認できるライブラリと Web UI です。コアパッケージ `jsfuck-gen` は DAG ベースのパターン辞書を持ち、最終出力文字だけでなく `constructor` や `toString` などの中間表現も解決しながら式を組み立てます。

## Features

- ASCII 文字列から JSFuck 式を生成
- `strict` mode で `[]()!+` のみの式へ制限
- difficulty に応じた候補選択とクイズ生成
- `Derivation` ツリーによる生成過程の説明
- printable ASCII をカバーする tier 1..4 パターン辞書
- Next.js Web UI: Generate / Quiz / Pattern Viewer

## Setup

```sh
pnpm install
```

## Commands

```sh
pnpm test
pnpm build
pnpm web:dev
pnpm web:build
```

パッケージ単体を確認する場合:

```sh
pnpm --dir packages/jsfuck-gen test
pnpm --dir packages/jsfuck-gen build
```

## Library Usage

```ts
import { generate, generateQuiz, explainParts } from "jsfuck-gen";

const result = generate("false", {
  difficulty: 5,
  strict: true,
  rng: Math.random,
});

if (result.ok) {
  console.log(result.expression);
  console.log(result.actualDifficulty);
  console.log(explainParts(result.parts));
}

const quiz = generateQuiz({
  difficulty: 2,
  strict: true,
  length: 3,
});
```

## API

```ts
generate(input: string, config: GeneratorConfig): GenerateResult
generateQuiz(config: QuizConfig): QuizResult

getPatterns(filter?: PatternFilter): Pattern[]
getSiblings(patternId: string): Pattern[]

explainDerivation(derivation: Derivation, indent?: number): string
explainParts(parts: GeneratedPart[]): string
```

`getPatterns()` はユーザー入力の生成に使う `kind: "jsfuck"` パターンだけを返します。中間表現を含む辞書全体を見たい場合は `ALL_PATTERNS` を使います。

## Generator Config

```ts
type GeneratorConfig = {
  difficulty: number;
  strict?: boolean;
  rng?: () => number;
};
```

- `difficulty`: 使えるパターン tier と探索幅を制御します。UI では `1..20`。
- `strict`: `true` の場合、`pure: true` パターンだけを使い、数値添字も JSFuck 式へ展開します。
- `rng`: テストや再現用の乱数注入。未指定時は `Math.random`。

## Web UI

```sh
pnpm web:dev
```

ページ:

- `/generate`: 入力文字列を JSFuck 式へ変換
- `/quiz`: 式を読んで評価結果を答えるクイズ
- `/patterns`: パターン辞書、deps、tags、difficulty の確認

## Specification

詳細な実装仕様は [SPECIFICATION.md](./SPECIFICATION.md) を参照してください。移行作業の設計メモは [packages/jsfuck-gen/MIGRATION_PLAN.md](./packages/jsfuck-gen/MIGRATION_PLAN.md) に残しています。
