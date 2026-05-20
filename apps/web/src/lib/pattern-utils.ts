import { ALL_PATTERNS, type GeneratedPart, type Pattern } from "jsfuck-gen";

type PatternWithLegacyMetadata = Pattern & {
  requires?: string[];
  trapFor?: string[];
};

export const allPatterns = ALL_PATTERNS;

const patternById = new Map(allPatterns.map((pattern) => [pattern.id, pattern]));
const patternByRole = new Map(ALL_PATTERNS.flatMap((pattern) => (pattern.role ? [[pattern.role, pattern]] : [])));

export function dependencyDepth(pattern: Pattern, seen = new Set<string>()): number {
  const deps = pattern.deps ?? (pattern as PatternWithLegacyMetadata).requires ?? [];
  if (seen.has(pattern.id) || deps.length === 0) return 0;
  const nextSeen = new Set(seen);
  nextSeen.add(pattern.id);

  return (
    1 +
    Math.max(
      0,
      ...deps.map((id) => {
        const required = patternById.get(id) ?? patternByRole.get(id);
        return required ? dependencyDepth(required, nextSeen) : 0;
      }),
    )
  );
}

export function hasTrapWarning(pattern: Pattern): boolean {
  const trapFor = (pattern as PatternWithLegacyMetadata).trapFor ?? [];
  if (trapFor.length > 0) return true;
  return allPatterns.some((candidate) => ((candidate as PatternWithLegacyMetadata).trapFor ?? []).includes(pattern.id));
}

export function uniqueTags(patterns: Pattern[] = allPatterns): string[] {
  return [...new Set(patterns.flatMap((pattern) => pattern.tags))].sort((a, b) => a.localeCompare(b));
}

export function partKey(part: GeneratedPart, index: number): string {
  return `${index}-${part.segment}-${part.pattern.id}`;
}
