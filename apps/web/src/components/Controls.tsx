"use client";

type GeneratorSettings = {
  difficulty: number;
  strict: boolean;
};

type Props = {
  settings: GeneratorSettings;
  onChange: (settings: GeneratorSettings) => void;
  children?: React.ReactNode;
};

export function Controls({ settings, onChange, children }: Props) {
  return (
    <div className="grid gap-4 rounded-lg border border-(--line) bg-white p-4 md:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-sm font-medium">difficulty {settings.difficulty.toFixed(1)}</span>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={settings.difficulty}
          onChange={(event) => onChange({ ...settings, difficulty: Number(event.target.value) })}
          className="accent-(--accent)"
        />
      </label>

      <label className="flex min-h-16 items-center gap-3 rounded-md border border-(--line) px-3">
        <input
          type="checkbox"
          checked={settings.strict}
          onChange={(event) => onChange({ ...settings, strict: event.target.checked })}
          className="h-5 w-5 accent-(--accent)"
        />
        <span className="text-sm font-medium">strict mode</span>
      </label>

      {children}
    </div>
  );
}
