"use client";

import { useMemo, useState } from "react";
import { generate, type GenerateResult } from "jsfuck-gen";
import { BreakdownTable } from "@/components/BreakdownTable";
import { Controls } from "@/components/Controls";
import { ResultStats } from "@/components/ResultStats";

type Settings = {
  difficulty: number;
  strict: boolean;
};

const initialSettings: Settings = {
  difficulty: 3,
  strict: false,
};

function isAscii(input: string): boolean {
  return /^[\x00-\x7F]*$/.test(input);
}

export default function GeneratePage() {
  const [input, setInput] = useState("false");
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const validation = useMemo(() => {
    if (input.length > 100) return "ASCII, 最大100文字まで入力できます。";
    if (!isAscii(input)) return "ASCII 文字だけを入力してください。";
    return "";
  }, [input]);

  function handleGenerate() {
    if (validation) return;
    setCopied(false);
    setResult(generate(input, settings));
  }

  async function copyExpression(expression: string) {
    await navigator.clipboard.writeText(expression);
    setCopied(true);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Generate Mode</h1>
        <p className="mt-1 text-sm text-(--muted)">入力文字列を JSFuck 式へ変換します。</p>
      </div>

      <section className="space-y-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">input</span>
          <textarea
            value={input}
            maxLength={100}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-28 resize-y rounded-lg border border-(--line) bg-white p-3 font-mono text-sm leading-6 outline-none focus:border-(--accent)"
          />
        </label>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className={validation ? "text-(--danger)" : "text-(--muted)"}>
            {validation || `${input.length}/100`}
          </span>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={Boolean(validation)}
            className="h-10 rounded-md bg-(--accent) px-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Generate
          </button>
        </div>
        <Controls settings={settings} onChange={setSettings} />
      </section>

      {result ? (
        result.ok ? (
          <section className="space-y-4">
            <div className="rounded-lg border border-(--line) bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-(--line) px-4 py-3">
                <h2 className="font-semibold">Expression</h2>
                <button
                  type="button"
                  onClick={() => copyExpression(result.expression)}
                  className="h-9 rounded-md border border-(--line) px-3 text-sm font-medium hover:bg-slate-100"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-80 overflow-auto p-4 text-xs leading-5">
                <code>{result.expression}</code>
              </pre>
            </div>
            <ResultStats
              output={result.output}
              actualDifficulty={result.actualDifficulty}
            />
            <BreakdownTable parts={result.parts} />
          </section>
        ) : (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-(--danger)">
            <p className="font-semibold">Generation failed: {result.reason}</p>
            {result.unsupportedChars ? (
              <p className="mt-2">unsupported: {result.unsupportedChars.map((ch) => JSON.stringify(ch)).join(", ")}</p>
            ) : null}
          </section>
        )
      ) : null}
    </div>
  );
}
