import Link from "next/link";

const modes = [
  {
    href: "/generate",
    title: "Generate Mode",
    body: "入力文字列から JSFuck 式を生成し、コストと構成パターンを確認します。",
  },
  {
    href: "/quiz",
    title: "Quiz Mode",
    body: "生成された式を読み、評価結果の文字列を回答します。",
  },
  {
    href: "/patterns",
    title: "Pattern Viewer",
    body: "登録済みパターンを絞り込み、依存や混同しやすい関係を調べます。",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 border-b border-[var(--line)] pb-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
            JSFuck practice tool
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            JSFuck Quiz & Generator
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            難易度、選択戦略、literal fallback の有無を切り替えながら、生成結果と
            パターン辞書を検証できます。
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-4">
          <code className="block break-all text-sm leading-6 text-slate-800">
            (![]+[])[+[]]+(![]+[])[+!![]]+(!![]+[])[+[]]
          </code>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {modes.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="rounded-lg border border-[var(--line)] bg-white p-5 transition hover:border-[var(--accent)] hover:shadow-sm"
          >
            <h2 className="text-lg font-semibold">{mode.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{mode.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
