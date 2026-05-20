import type { GeneratedPart } from "jsfuck-gen";
import { partDifficulty } from "jsfuck-gen";
import { dependencyDepth, hasTrapWarning, partKey } from "@/lib/pattern-utils";

type Props = {
  parts: GeneratedPart[];
};

export function BreakdownTable({ parts }: Props) {
  if (parts.length === 0) {
    return <p className="text-sm text-(--muted)">Breakdown is empty.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-(--line) bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-3 py-3">segment</th>
            <th className="px-3 py-3">expression</th>
            <th className="px-3 py-3">difficulty</th>
            <th className="px-3 py-3">tags</th>
            <th className="px-3 py-3">description</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, index) => {
            const depth = dependencyDepth(part.pattern);
            const warning = hasTrapWarning(part.pattern);
            return (
              <tr
                key={partKey(part, index)}
                className={warning ? "border-t border-amber-200 bg-amber-50" : "border-t border-(--line)"}
              >
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  <span style={{ paddingLeft: `${depth * 12}px` }} className="font-mono font-semibold">
                    {JSON.stringify(part.segment)}
                  </span>
                  {warning ? (
                    <span className="ml-2 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-(--warn)">
                      混同注意
                    </span>
                  ) : null}
                </td>
                <td className="max-w-xl px-3 py-3 align-top">
                  <code className="block break-all rounded bg-slate-100 p-2 text-xs leading-5">
                    {part.pattern.expression}
                  </code>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  {partDifficulty(part)}
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-wrap gap-1">
                    {part.pattern.tags.map((tag) => (
                      <span key={tag} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="min-w-48 px-3 py-3 align-top text-(--muted)">
                  {part.pattern.description ?? "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
