import type { GeneratedPart, Difficulty } from "./types.js";
import type { Pattern } from "./types.js";

// Weights from spec section 5.1
const W_AVG_DIFFICULTY = 0.4;
const W_STRUCTURAL_DEPTH = 0.2;
const W_TRAP_DENSITY = 0.3;
const W_SEGMENT_DIVERSITY = 0.1;

function avgPatternDifficulty(parts: GeneratedPart[]): number {
  if (parts.length === 0) return 1.0;
  return parts.reduce((sum, p) => sum + p.pattern.difficulty, 0) / parts.length;
}

function structuralDepth(parts: GeneratedPart[], allPatterns: Pattern[]): number {
  const patternMap = new Map(allPatterns.map((p) => [p.id, p]));

  function maxDepth(patternId: string, visited: Set<string>): number {
    if (visited.has(patternId)) return 0;
    visited.add(patternId);
    const p = patternMap.get(patternId);
    if (p === undefined || p.requires.length === 0) return 0;
    const childDepths = p.requires.map((req) => maxDepth(req, new Set(visited)));
    return 1 + Math.max(...childDepths);
  }

  if (parts.length === 0) return 1.0;

  const depths = parts.map((p) => maxDepth(p.pattern.id, new Set()));
  const rawMax = Math.max(...depths);

  // Normalize to 1.0~5.0 (assume max realistic depth ~10)
  return Math.min(5.0, Math.max(1.0, 1.0 + (rawMax / 10) * 4.0));
}

function trapDensity(parts: GeneratedPart[], allPatterns: Pattern[]): number {
  if (parts.length === 0) return 1.0;

  const partIds = new Set(parts.map((p) => p.pattern.id));
  let trapCount = 0;

  for (const pattern of allPatterns) {
    for (const trapId of pattern.trapFor) {
      if (partIds.has(trapId)) {
        trapCount++;
        break; // count each part at most once per pattern
      }
    }
  }

  const ratio = trapCount / parts.length;
  // Scale 0~1 to 1~5
  return 1.0 + ratio * 4.0;
}

function shannonEntropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -counts
    .filter((c) => c > 0)
    .reduce((sum, c) => {
      const p = c / total;
      return sum + p * Math.log2(p);
    }, 0);
}

function segmentDiversity(parts: GeneratedPart[]): number {
  if (parts.length === 0) return 1.0;

  const lengthCounts = new Map<number, number>();
  for (const p of parts) {
    const len = p.segment.length;
    lengthCounts.set(len, (lengthCounts.get(len) ?? 0) + 1);
  }

  const entropy = shannonEntropy([...lengthCounts.values()]);
  const maxEntropy = Math.log2(Math.min(parts.length, MAX_SEG));

  if (maxEntropy === 0) return 1.0;
  const normalized = entropy / maxEntropy;
  return Math.min(5.0, Math.max(1.0, 1.0 + normalized * 4.0));
}

const MAX_SEG = 8;

export function computeActualDifficulty(
  parts: GeneratedPart[],
  allPatterns: Pattern[],
): Difficulty {
  const avg = avgPatternDifficulty(parts);
  const depth = structuralDepth(parts, allPatterns);
  const trap = trapDensity(parts, allPatterns);
  const div = segmentDiversity(parts);

  return (
    W_AVG_DIFFICULTY * avg +
    W_STRUCTURAL_DEPTH * depth +
    W_TRAP_DENSITY * trap +
    W_SEGMENT_DIVERSITY * div
  );
}
