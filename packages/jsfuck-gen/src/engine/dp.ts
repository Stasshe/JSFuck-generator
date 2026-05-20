import {
  MAX_DIFFICULTY,
  difficultyError,
  patternDifficulty,
} from "../difficulty.js";
import type { GeneratedPart, GeneratorConfig, Pattern } from "../types.js";
import { boundedVarietyPool, candidatePatterns } from "./selector.js";

const MAX_SEG = 8;
const MAX_STATES_PER_POS = 500;
const MAX_STATES_PER_DIFFICULTY = 10;

type Choice = {
  j: number;
  pattern: Pattern;
};

type State = {
  pos: number;
  difficulty: number;
  expressionCost: number;
  prev: State | null;
  choice: Choice | null;
};

export function segmentDP(
  input: string,
  patterns: Pattern[],
  config: GeneratorConfig,
): GeneratedPart[] | null {
  const rng = config.rng ?? Math.random;
  const n = input.length;
  const states: State[][] = Array.from({ length: n + 1 }, () => []);
  states[0]!.push({
    pos: 0,
    difficulty: 0,
    expressionCost: 0,
    prev: null,
    choice: null,
  });

  for (let pos = 0; pos < n; pos++) {
    const currentStates = states[pos];
    if (currentStates === undefined || currentStates.length === 0) continue;

    for (let j = pos + 1; j <= Math.min(n, pos + MAX_SEG); j++) {
      const segment = input.slice(pos, j);
      const candidates = candidatePatterns(segment, patterns, config);
      if (candidates.length === 0) continue;

      const pool = boundedVarietyPool(candidates, config.difficulty);
      const nextStates = states[j];
      if (nextStates === undefined) continue;

      for (const state of currentStates) {
        for (const selected of pool) {
          nextStates.push({
            pos: j,
            difficulty: state.difficulty + patternDifficulty(selected),
            expressionCost: state.expressionCost + selected.expression.length,
            prev: state,
            choice: { j: pos, pattern: selected },
          });
        }
      }

      states[j] = pruneStates(nextStates, config.difficulty);
    }
  }

  const finalStates = states[n];
  if (finalStates === undefined || finalStates.length === 0) return null;

  return reconstruct(input, selectFinalState(finalStates, config.difficulty, rng));
}

function selectFinalState(states: State[], targetDifficulty: number, rng: () => number): State {
  const bestError = Math.min(...states.map((state) => stateError(state, targetDifficulty)));
  const best = states.filter((state) => stateError(state, targetDifficulty) === bestError);
  const bestDifficulty =
    targetDifficulty >= MAX_DIFFICULTY
      ? Math.max(...best.map((state) => state.difficulty))
      : undefined;
  const pool =
    bestDifficulty === undefined ? best : best.filter((state) => state.difficulty === bestDifficulty);
  const totalWeight = pool.reduce((sum, state) => sum + stateWeight(state), 0);
  let target = rng() * totalWeight;

  for (const state of pool) {
    target -= stateWeight(state);
    if (target <= 0) return state;
  }

  return pool[pool.length - 1]!;
}

function pruneStates(states: State[], targetDifficulty: number): State[] {
  const byDifficulty = new Map<number, State[]>();

  for (const state of states) {
    const bucket = byDifficulty.get(state.difficulty) ?? [];
    bucket.push(state);
    byDifficulty.set(state.difficulty, bucket);
  }

  const kept: State[] = [];
  for (const bucket of byDifficulty.values()) {
    bucket.sort((a, b) => a.expressionCost - b.expressionCost);
    kept.push(...bucket.slice(0, MAX_STATES_PER_DIFFICULTY));
  }

  kept.sort((a, b) => {
    const errorDiff = stateError(a, targetDifficulty) - stateError(b, targetDifficulty);
    if (errorDiff !== 0) return errorDiff;

    if (targetDifficulty >= MAX_DIFFICULTY && a.difficulty !== b.difficulty) {
      return b.difficulty - a.difficulty;
    }

    return a.expressionCost - b.expressionCost;
  });

  return kept.slice(0, MAX_STATES_PER_POS);
}

function reconstruct(input: string, state: State): GeneratedPart[] {
  const parts: GeneratedPart[] = [];
  let current: State | null = state;

  while (current !== null && current.choice !== null && current.prev !== null) {
    const { choice, pos } = current;
    parts.push({
      segment: input.slice(choice.j, pos),
      pattern: choice.pattern,
    });
    current = current.prev;
  }

  parts.reverse();
  return parts;
}

function stateError(state: State, targetDifficulty: number): number {
  return difficultyError(state.difficulty, targetDifficulty);
}

function stateWeight(state: State): number {
  return 1 / Math.max(1, state.expressionCost);
}
