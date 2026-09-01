import { describe, it, expect } from "vitest";
import { createDataset, DATASET_SIZES, DEFAULT_SEED } from "./datasets.js";
import {
  createDependencyGraph,
  calculateSchedule,
  evaluateTasks,
  recommendNextTask,
  simulateScenario,
  applyScenario,
} from "../src/domain/index.js";
import { runBenchmark, OPERATION_NAMES } from "./benchmark.js";

/**
 * These tests verify the benchmark harness's own guarantees: deterministic,
 * reproducible datasets and deterministic domain results for identical inputs.
 * They run only under `npm run benchmark`, not the default test suite.
 */

describe("benchmark datasets", () => {
  it("are reproducible for the same seed", () => {
    const a = createDataset(500, DEFAULT_SEED);
    const b = createDataset(500, DEFAULT_SEED);
    expect(a.tasks).toEqual(b.tasks);
    expect(a.taskCount).toBe(500);
  });

  it("differ across sizes and are valid task sets", () => {
    for (const size of DATASET_SIZES) {
      const ds = createDataset(size, DEFAULT_SEED);
      expect(ds.tasks).toHaveLength(size);
      const ids = new Set(ds.tasks.map((t) => t.id));
      expect(ids.size).toBe(size);
      // Every dependency references a known task.
      for (const task of ds.tasks) {
        for (const dep of task.dependencies) {
          expect(ids.has(dep)).toBe(true);
        }
      }
    }
  });
});

describe("benchmark operation determinism", () => {
  it("produces identical domain results across repeated runs", () => {
    for (const size of [100, 1000]) {
      const { tasks } = createDataset(size, DEFAULT_SEED);
      const graph = createDependencyGraph(tasks);
      const schedule = calculateSchedule(tasks, graph);

      expect(graph.topologicalOrder()).toEqual(
        createDependencyGraph(tasks).topologicalOrder(),
      );
      expect(schedule.criticalPath).toEqual(
        calculateSchedule(tasks, createDependencyGraph(tasks)).criticalPath,
      );
      expect(evaluateTasks(tasks, graph, schedule)).toEqual(
        evaluateTasks(
          tasks,
          createDependencyGraph(tasks),
          calculateSchedule(tasks, graph),
        ),
      );
      expect(recommendNextTask(tasks, graph, schedule)).toEqual(
        recommendNextTask(
          tasks,
          createDependencyGraph(tasks),
          calculateSchedule(tasks, graph),
        ),
      );
    }
  });

  it("applies scenarios deterministically without mutating input", () => {
    const { tasks } = createDataset(200, DEFAULT_SEED);
    const snapshot = JSON.stringify(tasks);

    const scenario = {
      kind: "delay-task" as const,
      taskId: "t00000",
      additionalEffort: 1,
    };
    const applied = applyScenario(tasks, scenario);
    expect(applied).toEqual(applyScenario(tasks, scenario));
    expect(JSON.stringify(tasks)).toBe(snapshot);

    const result = simulateScenario(tasks, scenario);
    expect(result).toEqual(simulateScenario(tasks, scenario));
    expect(result.baseline.recommendedTaskId).toBe(
      recommendNextTask(
        tasks,
        createDependencyGraph(tasks),
        calculateSchedule(tasks, createDependencyGraph(tasks)),
      ).taskId,
    );
  });
});

describe("benchmark harness output", () => {
  it("covers every dataset size and required operation", () => {
    const results = runBenchmark(DATASET_SIZES, DEFAULT_SEED);

    // Every operation in the canonical list is measured, at every dataset size.
    for (const name of OPERATION_NAMES) {
      const matches = results.filter((r) => r.operation === name);
      expect(matches.map((m) => m.taskCount)).toEqual([...DATASET_SIZES]);
      for (const m of matches) {
        expect(m.meanMs).toBeGreaterThanOrEqual(0);
        expect(m.minMs).toBeGreaterThanOrEqual(0);
        expect(m.iterations).toBeGreaterThan(0);
      }
    }

    // No operation outside the canonical list is reported.
    const reported = new Set(results.map((r) => r.operation));
    expect(reported.size).toBe(OPERATION_NAMES.length);
  }, 120_000);
});

describe("benchmark timing report", () => {
  it("prints a results table for every dataset size", () => {
    const results = runBenchmark(DATASET_SIZES, DEFAULT_SEED);
    const counts = new Set(results.map((r) => r.taskCount));
    for (const size of DATASET_SIZES) {
      expect(counts.has(size)).toBe(true);
    }

    const headers =
      "operation".padEnd(30) +
      "tasks".padStart(6) +
      "mean (ms)".padStart(10) +
      "min (ms)".padStart(10) +
      "iterations".padStart(10);
    console.log(`\n${headers}\n${"-".repeat(headers.length)}`);
    console.table(
      results.map((r) => ({
        operation: r.operation,
        tasks: r.taskCount,
        "mean (ms)": r.meanMs.toFixed(3),
        "min (ms)": r.minMs.toFixed(3),
        iterations: r.iterations,
      })),
    );
  }, 120_000);
});
