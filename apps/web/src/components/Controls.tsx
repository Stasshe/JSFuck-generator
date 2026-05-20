"use client";

import type { SelectStrategy } from "jsfuck-gen";

type GeneratorSettings = {
  difficulty: number;
  strategy: SelectStrategy;
  allowLiteral: boolean;
};

type Props = {
  settings: GeneratorSettings;
  onChange: (settings: GeneratorSettings) => void;
  children?: React.ReactNode;
};

export function Controls({ settings, onChange, children }: Props) {
  return (
    <div className="grid gap-4 rounded-lg border border-(--line) bg-white p-4 md:grid-cols-3">
      <label className="grid gap-2">
        <span className="text-sm font-medium">difficulty {settings.difficulty.toFixed(1)}</span>
        <input
          type="range"
          min="1"
          max="5"
          step="0.1"
          value={settings.difficulty}
          onChange={(event) => onChange({ ...settings, difficulty: Number(event.target.value) })}
          className="accent-(--accent)"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">strategy</span>
        <select
          value={settings.strategy}
          onChange={(event) =>
            onChange({ ...settings, strategy: event.target.value as SelectStrategy })
          }
          className="h-10 rounded-md border border-(--line) bg-white px-3"
        >
          <option value="random">random</option>
          <option value="shortest">shortest</option>
          <option value="readable">readable</option>
        </select>
      </label>

      <label className="flex min-h-16 items-center gap-3 rounded-md border border-(--line) px-3">
        <input
          type="checkbox"
          checked={settings.allowLiteral}
          onChange={(event) => onChange({ ...settings, allowLiteral: event.target.checked })}
          className="h-5 w-5 accent-(--accent)"
        />
        <span className="text-sm font-medium">allow literal fallback</span>
      </label>

      {children}
    </div>
  );
}
