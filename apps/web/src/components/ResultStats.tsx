type Props = {
  output?: string;
  totalCost: number;
  actualDifficulty: number;
};

export function ResultStats({ output, totalCost, actualDifficulty }: Props) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {output !== undefined ? (
        <div className="rounded-lg border border-[var(--line)] bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">output</dt>
          <dd className="mt-1 break-all font-mono text-lg">{JSON.stringify(output)}</dd>
        </div>
      ) : null}
      <div className="rounded-lg border border-[var(--line)] bg-white p-4">
        <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">totalCost</dt>
        <dd className="mt-1 text-lg font-semibold">{totalCost}</dd>
      </div>
      <div className="rounded-lg border border-[var(--line)] bg-white p-4">
        <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">actualDifficulty</dt>
        <dd className="mt-1 text-lg font-semibold">{actualDifficulty.toFixed(2)}</dd>
      </div>
    </dl>
  );
}
