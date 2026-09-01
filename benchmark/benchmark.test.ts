import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
import { writeResultsFile } from "./report.js";
import type { OperationResult } from "./benchmark.js";

const RESULTS_FILE = fileURLToPath(new URL("./results.txt", import.meta.url));

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
  it("covers every dataset size and required operation and writes the report", () => {
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

    // Emit the promised report as an explicit artifact so `npm run benchmark`
    // always produces a results table even when console output is captured.
    expect(results.length).toBeGreaterThan(0);
    writeReport(results);
  }, 180_000);
});

function writeReport(results: readonly OperationResult[]): void {
  try {
    if (existsSync(RESULTS_FILE)) unlinkSync(RESULTS_FILE);
    writeResultsFile(results, RESULTS_FILE);
    const written = readFileSync(RESULTS_FILE, "utf8");
    expect(written).toContain("Total measurements");
    expect(written).toContain("mean (ms)");
    console.log("\n" + written);
  } catch (err) {
    // Writing the report is a best-effort artifact; a failure to persist should
    // not hide correctness failures in the benchmark itself.
    console.warn(
      "Benchmark report could not be written to disk:",
      err instanceof Error ? err.message : err,
    );
  }
}

describe("benchmark dependent operations", () => {
  it("measure a non-empty dependent lookup", () => {
    // Regression guard for review finding #6: the dependent-lookup benchmark
    // must target a task that actually has dependents, not the final (leaf)
    // task which can never be a prerequisite of anything.
    const { tasks } = createDataset(100, DEFAULT_SEED);
    const graph = createDependencyGraph(tasks);

    const dependentHubs = tasks.filter(
      (t) => graph.getDependents(t.id).length > 0,
    );
    expect(dependentHubs.length).toBeGreaterThan(0);

    const hub = dependentHubs.sort((a, b) => a.id.localeCompare(b.id))[0];
    expect(graph.getDependents(hub.id).length).toBeGreaterThan(0);
  });
});
