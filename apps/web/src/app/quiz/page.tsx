"use client";

import { useState } from "react";
import { generateQuiz, type QuizQuestion, type SelectStrategy } from "jsfuck-gen";
import { BreakdownTable } from "@/components/BreakdownTable";
import { Controls } from "@/components/Controls";
import { ResultStats } from "@/components/ResultStats";

type Settings = {
  difficulty: number;
  strategy: SelectStrategy;
  allowLiteral: boolean;
};

type AnswerState = "idle" | "correct" | "incorrect";

const initialSettings: Settings = {
  difficulty: 2,
  strategy: "random",
  allowLiteral: false,
};

export default function QuizPage() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [length, setLength] = useState("");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [error, setError] = useState("");

  function handleGenerate() {
    const parsedLength = length.trim() === "" ? undefined : Number(length);
    if (parsedLength !== undefined && (!Number.isInteger(parsedLength) || parsedLength < 1 || parsedLength > 100)) {
      setError("length は 1 から 100 の整数で指定してください。");
      return;
    }

    const result = generateQuiz(
      parsedLength === undefined ? settings : { ...settings, length: parsedLength },
    );
    if (!result.ok) {
      setError(result.reason);
      setQuestion(null);
      return;
    }

    setQuestion(result.question);
    setAnswer("");
    setAnswerState("idle");
    setError("");
  }

  function handleSubmit() {
    if (!question) return;
    setAnswerState(answer === question.answer ? "correct" : "incorrect");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Quiz Mode</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">式を読んで、評価される文字列を回答します。</p>
      </div>

      <section className="space-y-4">
        <Controls settings={settings} onChange={setSettings}>
          <label className="grid gap-2 md:col-span-1">
            <span className="text-sm font-medium">length</span>
            <input
              type="number"
              min="1"
              max="100"
              placeholder="auto"
              value={length}
              onChange={(event) => setLength(event.target.value)}
              className="h-10 rounded-md border border-[var(--line)] bg-white px-3"
            />
          </label>
        </Controls>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            className="h-10 rounded-md bg-[var(--accent)] px-4 font-semibold text-white"
          >
            Generate
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]">
          {error}
        </section>
      ) : null}

      {question ? (
        <section className="space-y-4">
          <div className="rounded-lg border border-[var(--line)] bg-white">
            <div className="border-b border-[var(--line)] px-4 py-3 font-semibold">Question</div>
            <pre className="max-h-80 overflow-auto p-4 text-xs leading-5">
              <code>{question.expression}</code>
            </pre>
          </div>

          <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-medium">answer</span>
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                className="h-10 rounded-md border border-[var(--line)] px-3 font-mono outline-none focus:border-[var(--accent)]"
              />
            </label>
            <button
              type="button"
              onClick={handleSubmit}
              className="self-end rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white"
            >
              Submit
            </button>
          </div>

          {answerState !== "idle" ? (
            <div
              className={
                answerState === "correct"
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                  : "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]"
              }
            >
              <p className="font-semibold">{answerState === "correct" ? "正解" : "不正解"}</p>
              <p className="mt-2">正しい出力文字列: <code>{JSON.stringify(question.answer)}</code></p>
            </div>
          ) : null}

          {answerState !== "idle" ? (
            <>
              <ResultStats
                output={question.answer}
                totalCost={question.totalCost}
                actualDifficulty={question.actualDifficulty}
              />
              <BreakdownTable parts={question.parts} />
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
