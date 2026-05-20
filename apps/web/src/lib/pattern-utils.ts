import { getPatterns, type GeneratedPart, type Pattern } from "jsfuck-gen";

export const allPatterns = getPatterns();

const patternById = new Map(allPatterns.map((pattern) => [pattern.id, pattern]));

export function dependencyDepth(pattern: Pattern, seen = new Set<string>()): number {
  if (seen.has(pattern.id) || pattern.requires.length === 0) return 0;
  const nextSeen = new Set(seen);
  nextSeen.add(pattern.id);

  return (
    1 +
    Math.max(
      0,
      ...pattern.requires.map((id) => {
        const required = patternById.get(id);
        return required ? dependencyDepth(required, nextSeen) : 0;
      }),
    )
  );
}

export function hasTrapWarning(pattern: Pattern): boolean {
  return pattern.trapFor.length > 0 || allPatterns.some((candidate) => candidate.trapFor.includes(pattern.id));
}

export function uniqueTags(patterns: Pattern[] = allPatterns): string[] {
  return [...new Set(patterns.flatMap((pattern) => pattern.tags))].sort((a, b) => a.localeCompare(b));
}

export function partKey(part: GeneratedPart, index: number): string {
  return `${index}-${part.segment}-${part.pattern.id}`;
}
