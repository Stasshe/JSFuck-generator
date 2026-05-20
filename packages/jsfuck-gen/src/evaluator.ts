import type { Difficulty, GeneratedPart, Pattern } from "./types.js";
import { partDifficulty } from "./difficulty.js";

export function computeActualDifficulty(
  parts: GeneratedPart[],
  _allPatterns: Pattern[],
): Difficulty {
  if (parts.length === 0) return 1.0;
  const totalChars = parts.reduce((s, p) => s + p.segment.length, 0);
  if (totalChars === 0) return 1.0;
  const total = parts.reduce((sum, part) => sum + partDifficulty(part), 0);
  return total / totalChars;
}
