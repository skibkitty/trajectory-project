import { createTask, TaskStatus } from "../src/domain/index.js";
import type { Task } from "../src/domain/index.js";

/**
 * Deterministic task-dataset generation for benchmarks.
 *
 * A small seeded LCG produces reproducible pseudo-random values so that a given
 * `seed` always yields the same task set. This keeps benchmark inputs
 * reproducible across runs and machines without adding a dependency.
 */

export interface BenchmarkDataset {
  readonly taskCount: number;
  readonly tasks: readonly Task[];
}

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // 2^31 - 1 (a Mersenne prime modulus used by Park–Miller generators).
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Build a deterministic DAG of `count` tasks.
 *
 * Tasks are laid out in a natural execution order: each task may depend on a
 * few earlier tasks, which guarantees a valid DAG (no cycles) while still
 * producing a non-trivial dependency structure. Task metadata (value, urgency,
 * effort, confidence) is drawn from the same seeded stream so every metric
 * varies in a reproducible way.
 */
export function createDataset(count: number, seed = 42): BenchmarkDataset {
  const rand = lcg(seed);
  const tasks: Task[] = [];

  for (let i = 0; i < count; i += 1) {
    const id = `t${String(i).padStart(5, "0")}`;
    const dependencies: string[] = [];

    if (i > 0) {
      const prereqCount = Math.floor(rand() * 3); // 0..2 prerequisites
      const seen = new Set<number>();
      for (let p = 0; p < prereqCount && dependencies.length < 2; p += 1) {
        const idx = Math.floor(rand() * i);
        if (idx !== i && !seen.has(idx)) {
          seen.add(idx);
          dependencies.push(`t${String(idx).padStart(5, "0")}`);
        }
      }
    }

    tasks.push(
      createTask({
        id,
        title: id,
        status: i === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.BACKLOG,
        value: Math.floor(rand() * 100),
        urgency: Math.floor(rand() * 100),
        estimatedEffort: 1 + Math.round(rand() * 10),
        confidence: Math.round(rand() * 100) / 100,
        dependencies,
      }),
    );
  }

  return { taskCount: count, tasks };
}

export const DEFAULT_SEED = 42;

export const DATASET_SIZES = [100, 1000, 5000] as const;

export const SCENARIO_TASK_ID = "t00000";
