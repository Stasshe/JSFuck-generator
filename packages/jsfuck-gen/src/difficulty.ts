import type { GeneratedPart, Pattern } from "./types.js";

export function patternTier(pattern: Pattern): number {
  for (const tag of pattern.tags) {
    const match = /^tier([1-4])$/.exec(tag);
    if (match?.[1] !== undefined) return Number(match[1]);
  }
  return 5;
}

export function patternDifficulty(pattern: Pattern): number {
  return patternTier(pattern) * Math.max(1, pattern.output.length);
}

export function partDifficulty(part: GeneratedPart): number {
  return patternTier(part.pattern) * part.segment.length;
}
