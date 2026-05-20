import type { Derivation, GeneratedPart } from "../types.js";

// 導出ツリーを人間が読めるインデント付きテキストに変換
export function explainDerivation(d: Derivation, indent = 0): string {
  const pad = "  ".repeat(indent);
  const desc = d.description ? ` — ${d.description}` : "";
  const exprPreview = d.expression.length > 60
    ? `${d.expression.slice(0, 57)}...`
    : d.expression;

  let result = `${pad}[${d.patternId}]${desc}\n${pad}  = ${exprPreview}\n`;

  for (const [role, dep] of Object.entries(d.deps)) {
    result += `${pad}  where @{${role}}:\n`;
    result += explainDerivation(dep, indent + 2);
  }

  return result;
}

// 生成結果全体の導出説明を返す
export function explainParts(parts: GeneratedPart[]): string {
  return parts
    .map((part, i) => {
      const header = `Part ${i + 1}: segment="${part.segment}"\n`;
      return header + explainDerivation(part.derivation, 1);
    })
    .join("\n");
}
