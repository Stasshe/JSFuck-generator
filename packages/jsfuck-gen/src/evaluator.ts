import type { Difficulty, GeneratedPart, Pattern } from "./types.js";
import { partDifficulty } from "./difficulty.js";

export function computeActualDifficulty(
  parts: GeneratedPart[],
  _allPatterns: Pattern[],
): Difficulty {
  if (parts.length === 0) return 1.0;
  return parts.reduce((sum, part) => sum + partDifficulty(part), 0);
}
