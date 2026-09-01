import {
  createDependencyGraph,
  calculateSchedule,
  evaluateTasks,
  recommendNextTask,
  simulateScenario,
} from "../src/domain/index.js";
import type { Task } from "../src/domain/index.js";
import {
  createDataset,
  DATASET_SIZES,
  DEFAULT_SEED,
  SCENARIO_TASK_ID,
} from "./datasets.js";

/**
 * Wall-clock micro-benchmarks for the key domain algorithms.
 *
 * Datasets are deterministic (see datasets.ts): a given seed always yields the
 * same task set, so every operation's *domain result* is reproducible. Wall-
 * clock timings are inherently machine-dependent, but the methodology (best-of
 * N iterations, mean + min) is fixed and reported for transparency.
 */

export interface OperationResult {
  readonly operation: string;
  readonly taskCount: number;
  readonly meanMs: number;
  readonly minMs: number;
  readonly iterations: number;
}

function bestOf<T>(
  iterations: number,
  fn: () => T,
): { meanMs: number; minMs: number } {
  let min = Infinity;
  let total = 0;
  for (let i = 0; i < iterations; i += 1) {
    const start = process.hrtime.bigint();
    fn();
    const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
    if (elapsed < min) min = elapsed;
    total += elapsed;
  }
  return { meanMs: total / iterations, minMs: min };
}

function iterationsFor(count: number): number {
  // More iterations for smaller graphs, fewer for larger ones: the cost of a
  // single iteration grows with the graph size, so we trade stability for wall
  // time while keeping every reported mean based on a meaningful sample.
  if (count <= 100) return 50;
  if (count <= 1000) return 20;
  return 5;
}

/**
 * Canonical list of the operations the harness measures. Exported so the
 * runner and the coverage test cannot drift apart.
 */
export const OPERATION_NAMES = [
  "graph-construction",
  "topological-order",
  "cycle-detection",
  "prerequisite-lookup",
  "dependent-lookup",
  "transitive-dependents",
  "transitive-prerequisites",
  "reachability",
  "critical-path",
  "decision-scoring",
  "recommendation",
  "scenario-simulation",
] as const;

/**
 * Measure every named operation against a deterministic dataset.
 *
 * Each operation is invoked through a closure so identical inputs are used.
 * One operation ("scenario-simulation") depends on an existing task id; the
 * dataset guarantees t00000 exists (see datasets.ts).
 */
export function runBenchmark(
  sizes: readonly number[] = DATASET_SIZES,
  seed = DEFAULT_SEED,
): OperationResult[] {
  const results: OperationResult[] = [];

  for (const count of sizes) {
    const iterations = iterationsFor(count);
    const { tasks, graph, schedule } = buildContext(count, seed);

    const operations = collectOperations({ count, tasks, graph, schedule });

    for (const { name, fn } of operations) {
      const { meanMs, minMs } = bestOf(iterations, fn);
      results.push({
        operation: name,
        taskCount: count,
        meanMs,
        minMs,
        iterations,
      });
    }
  }

  // Group by operation, then order ascending by task count.
  const order = [...new Set(results.map((r) => r.operation))];
  return order.flatMap((name) =>
    results
      .filter((r) => r.operation === name)
      .sort((a, b) => a.taskCount - b.taskCount),
  );
}

interface BenchmarkContext {
  readonly count: number;
  readonly tasks: readonly Task[];
  readonly graph: ReturnType<typeof createDependencyGraph>;
  readonly schedule: ReturnType<typeof calculateSchedule>;
}

function buildContext(count: number, seed: number): BenchmarkContext {
  const { tasks } = createDataset(count, seed);
  const graph = createDependencyGraph(tasks);
  const schedule = calculateSchedule(tasks, graph);
  return { count, tasks, graph, schedule };
}

interface NamedOperation {
  readonly name: string;
  readonly fn: () => unknown;
}

function collectOperations(ctx: BenchmarkContext): readonly NamedOperation[] {
  const { tasks, graph, schedule } = ctx;
  const first = tasks[0].id;
  const last = tasks[tasks.length - 1].id;

  const ops: NamedOperation[] = [
    { name: "graph-construction", fn: () => createDependencyGraph(tasks) },
    { name: "topological-order", fn: () => graph.topologicalOrder() },
    { name: "cycle-detection", fn: () => graph.hasCycle() },
    { name: "prerequisite-lookup", fn: () => graph.getPrerequisites(first) },
    { name: "dependent-lookup", fn: () => graph.getDependents(last) },
    { name: "transitive-dependents", fn: () => graph.getAllDependents(first) },
    {
      name: "transitive-prerequisites",
      fn: () => graph.getAllPrerequisites(last),
    },
    {
      name: "reachability",
      fn: () => {
        for (const task of tasks) graph.isReachable(task.id, first);
      },
    },
    { name: "critical-path", fn: () => calculateSchedule(tasks, graph) },
    {
      name: "decision-scoring",
      fn: () => evaluateTasks(tasks, graph, schedule),
    },
    {
      name: "recommendation",
      fn: () => recommendNextTask(tasks, graph, schedule),
    },
    {
      name: "scenario-simulation",
      fn: () =>
        simulateScenario(tasks, {
          kind: "delay-task",
          taskId: SCENARIO_TASK_ID,
          additionalEffort: 1,
        }),
    },
  ];

  return ops;
}
