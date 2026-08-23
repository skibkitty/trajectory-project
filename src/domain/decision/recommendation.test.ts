import { describe, it, expect } from "vitest";
import { createTask } from "../task.js";
import type { Task } from "../task.js";
import { createDependencyGraph } from "../graph/dependency-graph.js";
import { calculateSchedule } from "../scheduling/schedule.js";
import { evaluateTasks, DEFAULT_FACTORS } from "./engine.js";
import { recommendNextTask } from "./recommendation.js";
import type { ScoringFactor } from "./engine.js";

function task(
  id: string,
  overrides: Partial<{
    status: Task["status"];
    value: number;
    urgency: number;
    estimatedEffort: number;
    confidence: number;
    dependencies: string[];
  }> = {},
): Task {
  return createTask({
    id,
    title: id,
    ...overrides,
  });
}

function recommend(tasks: Task[], factors?: ScoringFactor[]) {
  const g = createDependencyGraph(tasks);
  const s = calculateSchedule(tasks, g);
  return recommendNextTask(tasks, g, s, factors);
}

describe("recommendNextTask — selection", () => {
  it("recommends the same task evaluateTasks selects", () => {
    const tasks = [
      task("a", { value: 10 }),
      task("b", { value: 5 }),
      task("c", { status: "DONE" }),
    ];
    const g = createDependencyGraph(tasks);
    const s = calculateSchedule(tasks, g);
    const evaluation = evaluateTasks(tasks, g, s);
    const recommendation = recommend(tasks);
    expect(recommendation.taskId).toBe(evaluation.selectedTaskId);
    expect(recommendation.taskId).toBe("a");
  });

  it("returns the selected candidate's score and factors", () => {
    const tasks = [task("a", { value: 5 }), task("b", { value: 2 })];
    const recommendation = recommend(tasks);
    expect(recommendation.score).not.toBeNull();
    expect(recommendation.factors).toHaveLength(DEFAULT_FACTORS.length);
    expect(recommendation.factors.map((f) => f.id)).toEqual([
      "value",
      "urgency",
      "dependency",
      "criticalPath",
      "confidence",
      "effort",
    ]);
  });

  it("matches the engine's factor breakdown exactly for the selected task", () => {
    const tasks = [
      task("a", { value: 5, urgency: 3, confidence: 0.7 }),
      task("b", { value: 1 }),
    ];
    const g = createDependencyGraph(tasks);
    const s = calculateSchedule(tasks, g);
    const evaluation = evaluateTasks(tasks, g, s);
    const recommendation = recommendNextTask(tasks, g, s);
    const topEvaluation = evaluation.candidates[0];
    expect(recommendation.factors).toEqual(topEvaluation.factors);
    expect(recommendation.score).toBe(topEvaluation.score);
  });

  it("propagates custom factors to the explanation", () => {
    const subset = [DEFAULT_FACTORS[0], DEFAULT_FACTORS[4]];
    const tasks = [task("a", { value: 5 })];
    const recommendation = recommend(tasks, subset);
    expect(recommendation.factors).toHaveLength(2);
    expect(recommendation.factors.map((f) => f.id)).toEqual([
      "value",
      "confidence",
    ]);
  });
});

describe("recommendNextTask — empty results", () => {
  it("returns null task with a warning for an empty project", () => {
    const recommendation = recommend([]);
    expect(recommendation.taskId).toBeNull();
    expect(recommendation.score).toBeNull();
    expect(recommendation.factors).toEqual([]);
    expect(recommendation.warnings).toHaveLength(1);
    expect(recommendation.warnings[0].id).toBe("no-eligible-tasks");
  });

  it("returns null task when every task is DONE", () => {
    const recommendation = recommend([task("a", { status: "DONE" })]);
    expect(recommendation.taskId).toBeNull();
    expect(
      recommendation.warnings.some((w) => w.id === "no-eligible-tasks"),
    ).toBe(true);
  });

  it("still reports assumptions when nothing is eligible", () => {
    const recommendation = recommend([task("a", { status: "DONE" })]);
    expect(recommendation.assumptions.length).toBeGreaterThan(0);
  });
});

describe("recommendNextTask — assumptions", () => {
  it("always includes the core assumptions in a fixed order", () => {
    const tasks = [task("a", { value: 5 }), task("b")];
    const r1 = recommend(tasks);
    const expectedIds = [
      "additive-model",
      "normalization-maxima",
      "confidence-bounded",
      "critical-path-source",
      "tie-break-policy",
      "provisional-weights",
    ];
    expect(r1.assumptions.map((a) => a.id)).toEqual(expectedIds);

    const r2 = recommend([...tasks].reverse());
    expect(r2.assumptions.map((a) => a.id)).toEqual(expectedIds);
  });

  it("reports normalization maxima as assumption detail", () => {
    const tasks = [
      task("a", { value: 8, urgency: 4, estimatedEffort: 2 }),
      task("b"),
    ];
    const recommendation = recommend(tasks);
    const normalization = recommendation.assumptions.find(
      (a) => a.id === "normalization-maxima",
    );
    expect(normalization?.detail).toContain("max value 8");
    expect(normalization?.detail).toContain("max urgency 4");
  });
});

describe("recommendNextTask — warnings", () => {
  it("emits no warnings for a clean differentiated project", () => {
    const tasks = [
      task("a", { value: 10, urgency: 5, estimatedEffort: 3 }),
      task("b", {
        value: 4,
        estimatedEffort: 1,
        dependencies: ["a"],
      }),
    ];
    const recommendation = recommend(tasks);
    expect(recommendation.warnings).toEqual([]);
    expect(recommendation.taskId).toBe("a");
  });

  it("warns when candidates tie at the top score", () => {
    const tasks = [task("b", { value: 5 }), task("a", { value: 5 })];
    const recommendation = recommend(tasks);
    const tie = recommendation.warnings.find(
      (w) => w.id === "tie-break-applied",
    );
    expect(tie).toBeDefined();
    expect(tie?.affectedTaskIds).toEqual(["a", "b"]);
    expect(recommendation.taskId).toBe("a");
  });

  it("does not warn about ties when scores differ", () => {
    const tasks = [task("a", { value: 9 }), task("b", { value: 1 })];
    const recommendation = recommend(tasks);
    expect(
      recommendation.warnings.some((w) => w.id === "tie-break-applied"),
    ).toBe(false);
  });

  it("does not warn about ties below the top score", () => {
    const tasks = [
      task("top", { value: 10 }),
      task("a", { value: 2 }),
      task("b", { value: 2 }),
    ];
    const recommendation = recommend(tasks);
    const tie = recommendation.warnings.find(
      (w) => w.id === "tie-break-applied",
    );
    expect(tie).toBeUndefined();
    expect(recommendation.taskId).toBe("top");
  });

  it("links the tie warning to the actual selection", () => {
    const tasks = [
      task("beta", { value: 5, confidence: 0.9 }),
      task("alpha", { value: 5, confidence: 0.9 }),
    ];
    const recommendation = recommend(tasks);
    const tie = recommendation.warnings.find(
      (w) => w.id === "tie-break-applied",
    );
    expect(tie?.affectedTaskIds?.[0]).toBe(recommendation.taskId);
    expect(recommendation.taskId).toBe("alpha");
  });

  it("warns when a metric maximum is zero so normalization is inactive", () => {
    const tasks = [
      task("a", { value: 0, urgency: 0, confidence: 0.9 }),
      task("b", { value: 0, urgency: 0, confidence: 0.1 }),
    ];
    const recommendation = recommend(tasks);
    const zeroMax = recommendation.warnings.find(
      (w) => w.id === "zero-maximum-normalization",
    );
    expect(zeroMax).toBeDefined();
    expect(zeroMax?.message).toContain("value");
  });

  it("warns when BLOCKED tasks are eligible via completed prerequisites", () => {
    const tasks = [
      task("a", { status: "DONE" }),
      task("b", { status: "BLOCKED", dependencies: ["a"] }),
    ];
    const recommendation = recommend(tasks);
    const blocked = recommendation.warnings.find(
      (w) => w.id === "blocked-status-eligible",
    );
    expect(blocked?.affectedTaskIds).toEqual(["b"]);
  });

  it("does not flag IN_PROGRESS tasks as blocked-status conflicts", () => {
    const tasks = [task("a", { status: "IN_PROGRESS", value: 3 })];
    const recommendation = recommend(tasks);
    expect(
      recommendation.warnings.some((w) => w.id === "blocked-status-eligible"),
    ).toBe(false);
  });

  it("emits multiple warnings in a stable order", () => {
    const tasks = [
      task("b", { status: "BLOCKED", confidence: 0.9 }),
      task("a", { status: "BLOCKED", confidence: 0.9 }),
    ];
    const recommendation = recommend(tasks);
    expect(recommendation.warnings.map((w) => w.id)).toEqual([
      "tie-break-applied",
      "zero-maximum-normalization",
      "blocked-status-eligible",
    ]);
  });
});

describe("recommendNextTask — determinism and immutability", () => {
  it("produces identical output for identical inputs", () => {
    const build = () =>
      recommend([
        task("x", { value: 3, urgency: 2 }),
        task("y", { value: 3, urgency: 2 }),
        task("z", { value: 7, estimatedEffort: 4 }),
      ]);
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()));
  });

  it("is independent of input order", () => {
    const t1 = [
      task("c", { value: 3 }),
      task("a", { value: 10, estimatedEffort: 2 }),
      task("b", { value: 5 }),
    ];
    const r1 = recommend(t1);
    const r2 = recommend([...t1].reverse());
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it("returns frozen structures", () => {
    const recommendation = recommend([task("a", { value: 5 })]);
    expect(Object.isFrozen(recommendation)).toBe(true);
    expect(Object.isFrozen(recommendation.factors)).toBe(true);
    expect(Object.isFrozen(recommendation.assumptions)).toBe(true);
    expect(Object.isFrozen(recommendation.warnings)).toBe(true);
  });
});
