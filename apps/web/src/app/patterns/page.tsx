"use client";

import { useMemo, useState } from "react";
import type { PatternKind } from "jsfuck-gen";
import { allPatterns, dependencyDepth, hasTrapWarning, uniqueTags } from "@/lib/pattern-utils";

export default function PatternsPage() {
  const [output, setOutput] = useState("");
  const [minDifficulty, setMinDifficulty] = useState("1");
  const [maxDifficulty, setMaxDifficulty] = useState("5");
  const [tag, setTag] = useState("");
  const [kind, setKind] = useState<PatternKind | "all">("all");

  const tags = useMemo(() => uniqueTags(), []);
  const filtered = useMemo(() => {
    const min = Number(minDifficulty);
    const max = Number(maxDifficulty);
    return allPatterns.filter((pattern) => {
      if (output && pattern.output !== output) return false;
      if (Number.isFinite(min) && pattern.difficulty < min) return false;
      if (Number.isFinite(max) && pattern.difficulty > max) return false;
      if (tag && !pattern.tags.includes(tag)) return false;
      if (kind !== "all" && pattern.kind !== kind) return false;
      return true;
    });
  }, [output, minDifficulty, maxDifficulty, tag, kind]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Pattern Viewer</h1>
        <p className="mt-1 text-sm text-(--muted)">{filtered.length} / {allPatterns.length} patterns</p>
      </div>

      <section className="grid gap-3 rounded-lg border border-(--line) bg-white p-4 md:grid-cols-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium">output</span>
          <input
            value={output}
            onChange={(event) => setOutput(event.target.value.slice(0, 1))}
            className="h-10 rounded-md border border-(--line) px-3 font-mono"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">min difficulty</span>
          <input
            type="number"
            step="0.1"
            value={minDifficulty}
            onChange={(event) => setMinDifficulty(event.target.value)}
            className="h-10 rounded-md border border-(--line) px-3"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">max difficulty</span>
          <input
            type="number"
            step="0.1"
            value={maxDifficulty}
            onChange={(event) => setMaxDifficulty(event.target.value)}
            className="h-10 rounded-md border border-(--line) px-3"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">tags</span>
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="h-10 rounded-md border border-(--line) bg-white px-3"
          >
            <option value="">all</option>
            {tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">kind</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as PatternKind | "all")}
            className="h-10 rounded-md border border-(--line) bg-white px-3"
          >
            <option value="all">all</option>
            <option value="jsfuck">jsfuck</option>
            <option value="literal">literal</option>
          </select>
        </label>
      </section>

      <div className="overflow-x-auto rounded-lg border border-(--line) bg-white">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-3">id</th>
              <th className="px-3 py-3">output</th>
              <th className="px-3 py-3">expression</th>
              <th className="px-3 py-3">kind</th>
              <th className="px-3 py-3">difficulty</th>
              <th className="px-3 py-3">cost</th>
              <th className="px-3 py-3">tags</th>
              <th className="px-3 py-3">trapFor</th>
              <th className="px-3 py-3">requires</th>
              <th className="px-3 py-3">description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pattern) => {
              const warning = hasTrapWarning(pattern);
              return (
                <tr
                  key={pattern.id}
                  className={warning ? "border-t border-amber-200 bg-amber-50" : "border-t border-(--line)"}
                >
                  <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-xs">{pattern.id}</td>
                  <td className="px-3 py-3 align-top font-mono">{JSON.stringify(pattern.output)}</td>
                  <td className="max-w-lg px-3 py-3 align-top">
                    <code className="block break-all rounded bg-slate-100 p-2 text-xs leading-5">
                      {pattern.expression}
                    </code>
                  </td>
                  <td className="px-3 py-3 align-top">{pattern.kind}</td>
                  <td className="px-3 py-3 align-top">
                    {pattern.difficulty.toFixed(1)}
                    <span className="ml-2 text-xs text-(--muted)">depth {dependencyDepth(pattern)}</span>
                  </td>
                  <td className="px-3 py-3 align-top">{pattern.cost}</td>
                  <td className="px-3 py-3 align-top">{pattern.tags.join(", ") || "-"}</td>
                  <td className="px-3 py-3 align-top">{pattern.trapFor.join(", ") || "-"}</td>
                  <td className="px-3 py-3 align-top">{pattern.requires.join(", ") || "-"}</td>
                  <td className="min-w-56 px-3 py-3 align-top text-(--muted)">
                    {pattern.description ?? "-"}
                    {warning ? <span className="ml-2 font-medium text-(--warn)">混同注意</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
