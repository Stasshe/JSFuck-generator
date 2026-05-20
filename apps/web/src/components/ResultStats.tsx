type Props = {
  output?: string;
  actualDifficulty: number;
};

export function ResultStats({ output, actualDifficulty }: Props) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {output !== undefined ? (
        <div className="rounded-lg border border-(--line) bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-(--muted)">output</dt>
          <dd className="mt-1 break-all font-mono text-lg">{JSON.stringify(output)}</dd>
        </div>
      ) : null}
      <div className="rounded-lg border border-(--line) bg-white p-4">
        <dt className="text-xs uppercase tracking-wide text-(--muted)">actualDifficulty</dt>
        <dd className="mt-1 text-lg font-semibold">{actualDifficulty.toFixed(2)}</dd>
      </div>
    </dl>
  );
}
