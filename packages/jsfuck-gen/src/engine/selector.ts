import type { Pattern, GeneratorConfig, SelectStrategy } from "../types.js";

export function effectiveCost(p: Pattern, strategy: SelectStrategy): number {
  if (strategy === "shortest") return p.cost;
  if (strategy === "random") return p.cost / p.weight;
  // readable: halve cost for readable-tagged patterns
  return p.tags.includes("readable") ? p.cost * 0.5 : p.cost;
}

function weightedRandom(candidates: Pattern[], rng: () => number): Pattern {
  const totalWeight = candidates.reduce((sum, p) => sum + p.weight, 0);
  let pick = rng() * totalWeight;
  for (const p of candidates) {
    pick -= p.weight;
    if (pick <= 0) return p;
  }
  return candidates[candidates.length - 1]!;
}

export function selectPattern(
  segment: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): Pattern | null {
  const rng = config.rng ?? Math.random;

  let candidates = patterns.filter(
    (p) =>
      p.output === segment &&
      p.difficulty <= config.difficulty &&
      (config.allowLiteral || p.kind !== "literal"),
  );

  if (candidates.length === 0) return null;

  if (config.strategy === "shortest") {
    const minCost = Math.min(...candidates.map((p) => p.cost));
    const tied = candidates.filter((p) => p.cost === minCost);
    return weightedRandom(tied, rng);
  }

  if (config.strategy === "readable") {
    const readable = candidates.filter((p) => p.tags.includes("readable"));
    if (readable.length > 0) return weightedRandom(readable, rng);
    return weightedRandom(candidates, rng);
  }

  // random
  return weightedRandom(candidates, rng);
}
