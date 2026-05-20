import type { GeneratedPart, Pattern } from "./types.js";

export const MAX_DIFFICULTY = 20;
export const DIFFICULTY_TOLERANCE = 1;
export const DIFFICULTY_ATTEMPTS = 10;

export function patternTier(pattern: Pattern): number {
  if (pattern.kind === "literal") return 5;

  for (const tag of pattern.tags) {
    const match = /^tier([1-4])$/.exec(tag);
    if (match?.[1] !== undefined) return Number(match[1]);
  }

  return 5;
}

export function patternDifficulty(pattern: Pattern): number {
  return patternTier(pattern) * pattern.output.length;
}

export function partDifficulty(part: GeneratedPart): number {
  return patternTier(part.pattern) * part.segment.length;
}

export function difficultyError(actual: number, target: number): number {
  const below = Math.max(0, target - DIFFICULTY_TOLERANCE - actual);
  const above =
    target >= MAX_DIFFICULTY ? 0 : Math.max(0, actual - target - DIFFICULTY_TOLERANCE);
  return below + above;
}

export function isDifficultyWithinTolerance(actual: number, target: number): boolean {
  return difficultyError(actual, target) === 0;
}
