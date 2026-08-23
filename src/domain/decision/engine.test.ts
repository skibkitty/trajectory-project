import { describe, it, expect } from "vitest";
import { createTask } from "../task.js";
import type { Task } from "../task.js";
import { createDependencyGraph } from "../graph/dependency-graph.js";
import { calculateSchedule } from "../scheduling/schedule.js";
import { evaluateTasks, DEFAULT_FACTORS } from "./engine.js";
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

function evaluate(tasks: Task[], factors?: ScoringFactor[]) {
  const g = createDependencyGraph(tasks);
  const s = calculateSchedule(tasks, g);
  return evaluateTasks(tasks, g, s, factors);
}

describe("evaluateTasks — empty project", () => {
  it("returns no candidates for an empty task set", () => {
    const result = evaluate([]);
    expect(result.candidates).toEqual([]);
    expect(result.selectedTaskId).toBeNull();
  });
});

describe("evaluateTasks — eligibility", () => {
  it("excludes DONE tasks", () => {
    const result = evaluate([
      task("a", { status: "DONE" }),
      task("b", { status: "TODO" }),
    ]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].taskId).toBe("b");
  });

  it("excludes tasks blocked by incomplete prerequisites", () => {
    const result = evaluate([
      task("a", { status: "TODO" }),
      task("b", { status: "TODO", dependencies: ["a"] }),
    ]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].taskId).toBe("a");
  });

  it("includes tasks whose prerequisites are all DONE", () => {
    const result = evaluate([
      task("a", { status: "DONE" }),
      task("b", { status: "TODO", dependencies: ["a"] }),
    ]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].taskId).toBe("b");
  });

  it("includes tasks with no prerequisites", () => {
    const result = evaluate([
      task("a", { status: "TODO" }),
      task("b", { status: "TODO" }),
    ]);
    expect(result.candidates).toHaveLength(2);
  });

  it("excludes BLOCKED tasks that have incomplete prerequisites", () => {
    const result = evaluate([
      task("a", { status: "TODO" }),
      task("b", { status: "BLOCKED", dependencies: ["a"] }),
    ]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].taskId).toBe("a");
  });

  it("includes IN_PROGRESS tasks with completed prerequisites", () => {
    const result = evaluate([
      task("a", { status: "DONE" }),
      task("b", { status: "IN_PROGRESS", dependencies: ["a"] }),
    ]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].taskId).toBe("b");
  });
});

describe("evaluateTasks — scoring", () => {
  it("ranks higher-value tasks above lower-value tasks", () => {
    const result = evaluate([
      task("a", { value: 10 }),
      task("b", { value: 5 }),
    ]);
    expect(result.candidates[0].taskId).toBe("a");
    expect(result.candidates[1].taskId).toBe("b");
  });

  it("ranks higher-urgency tasks above lower-urgency tasks", () => {
    const result = evaluate([
      task("a", { urgency: 1 }),
      task("b", { urgency: 10 }),
    ]);
    expect(result.candidates[0].taskId).toBe("b");
    expect(result.candidates[1].taskId).toBe("a");
  });

  it("ranks tasks with more dependents higher", () => {
    const result = evaluate([
      task("a"),
      task("b"),
      task("c", { dependencies: ["a", "b"] }),
    ]);
    expect(result.candidates[0].taskId).toBe("a");
    expect(result.candidates[0].factors[2].contribution).toBeGreaterThan(0);
  });

  it("ranks critical-path tasks higher", () => {
    const a = task("a", { estimatedEffort: 5 });
    const b = task("b", { estimatedEffort: 1 });
    const c = task("c", { estimatedEffort: 1, dependencies: ["a", "b"] });
    const result = evaluate([a, b, c]);
    expect(result.candidates[0].taskId).toBe("a");
  });

  it("ranks higher-confidence tasks above lower-confidence tasks", () => {
    const result = evaluate([
      task("a", { confidence: 0.2 }),
      task("b", { confidence: 0.9 }),
    ]);
    expect(result.candidates[0].taskId).toBe("b");
  });

  it("penalizes higher-effort tasks", () => {
    const result = evaluate([
      task("critical", { estimatedEffort: 100 }),
      task("a", { estimatedEffort: 10 }),
      task("b", { estimatedEffort: 1 }),
    ]);
    const aIdx = result.candidates.findIndex((c) => c.taskId === "a");
    const bIdx = result.candidates.findIndex((c) => c.taskId === "b");
    expect(bIdx).toBeLessThan(aIdx);
  });
});

describe("evaluateTasks — tie-breaking", () => {
  it("breaks ties by task id lexicographically", () => {
    const result = evaluate([task("b", { value: 5 }), task("a", { value: 5 })]);
    expect(result.candidates[0].taskId).toBe("a");
    expect(result.candidates[1].taskId).toBe("b");
  });

  it("is deterministic for identical inputs", () => {
    const tasks = [
      task("x", { value: 3 }),
      task("y", { value: 3 }),
      task("z", { value: 3 }),
    ];
    const result1 = evaluate(tasks);
    const result2 = evaluate(tasks);
    expect(result1.candidates.map((c) => c.taskId)).toEqual(
      result2.candidates.map((c) => c.taskId),
    );
    expect(result1.selectedTaskId).toBe(result2.selectedTaskId);
  });
});

describe("evaluateTasks — factor breakdown", () => {
  it("returns factors with stable machine-readable ids", () => {
    const result = evaluate([task("a")]);
    expect(result.candidates[0].factors.map((f) => f.id)).toEqual([
      "value",
      "urgency",
      "dependency",
      "criticalPath",
      "confidence",
      "effort",
    ]);
  });

  it("exposes normalization maxima on the result", () => {
    const result = evaluate([
      task("a", { value: 8, urgency: 4, estimatedEffort: 2 }),
      task("b"),
    ]);
    expect(result.maxValues.value).toBe(8);
    expect(result.maxValues.urgency).toBe(4);
    expect(result.maxValues.effort).toBe(2);
    expect(Object.isFrozen(result.maxValues)).toBe(true);
  });

  it("returns factors for each candidate", () => {
    const result = evaluate([task("a", { value: 5, urgency: 3 })]);
    expect(result.candidates[0].factors).toHaveLength(6);
  });

  it("includes correct factor labels", () => {
    const result = evaluate([task("a")]);
    const labels = result.candidates[0].factors.map((f) => f.label);
    expect(labels).toEqual([
      "Value",
      "Urgency",
      "Dependency impact",
      "Critical path",
      "Confidence",
      "Effort penalty",
    ]);
  });

  it("marks effort penalty as negative direction", () => {
    const result = evaluate([task("a")]);
    const effortFactor = result.candidates[0].factors.find(
      (f) => f.label === "Effort penalty",
    );
    expect(effortFactor?.direction).toBe("negative");
  });

  it("marks positive factors as positive direction", () => {
    const result = evaluate([task("a", { value: 5 })]);
    const valueFactor = result.candidates[0].factors.find(
      (f) => f.label === "Value",
    );
    expect(valueFactor?.direction).toBe("positive");
  });

  it("includes source metrics in factors", () => {
    const result = evaluate([
      task("a", { value: 5, urgency: 3, confidence: 0.8 }),
    ]);
    const valueFactor = result.candidates[0].factors.find(
      (f) => f.label === "Value",
    );
    expect(valueFactor?.sourceMetric).toContain("value: 5");
  });
});

describe("evaluateTasks — normalization", () => {
  it("normalizes values relative to the maximum", () => {
    const result = evaluate([
      task("a", { value: 100 }),
      task("b", { value: 50 }),
    ]);
    const aScore = result.candidates.find((c) => c.taskId === "a")!;
    const bScore = result.candidates.find((c) => c.taskId === "b")!;
    expect(aScore.score).toBeGreaterThan(bScore.score);
  });

  it("handles all-zero values gracefully", () => {
    const result = evaluate([
      task("a", { value: 0, urgency: 0 }),
      task("b", { value: 0, urgency: 0 }),
    ]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].score).toBeGreaterThanOrEqual(0);
  });
});

describe("evaluateTasks — custom factors", () => {
  it("allows overriding a factor's weight", () => {
    const heavyValue: ScoringFactor = {
      ...DEFAULT_FACTORS[0],
      weight: 10,
    };
    const tasks = [
      task("a", { value: 10, urgency: 1 }),
      task("b", { value: 1, urgency: 10 }),
    ];
    const result = evaluate(tasks, [heavyValue, ...DEFAULT_FACTORS.slice(1)]);
    expect(result.candidates[0].taskId).toBe("a");
  });

  it("allows using a subset of factors", () => {
    const result = evaluate(
      [task("a", { value: 5 }), task("b", { value: 10 })],
      [DEFAULT_FACTORS[0]],
    );
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].taskId).toBe("b");
    expect(result.candidates[0].factors).toHaveLength(1);
  });

  it("allows adding a custom factor", () => {
    const customFactor: ScoringFactor = {
      id: "custom",
      label: "Custom",
      direction: "positive",
      weight: 100,
      compute(ctx) {
        return {
          normalized: ctx.task.id === "a" ? 1 : 0,
          sourceMetric: "custom",
          explanation: "Custom factor",
        };
      },
    };
    const result = evaluate(
      [task("a", { value: 1 }), task("b", { value: 100 })],
      [...DEFAULT_FACTORS, customFactor],
    );
    expect(result.candidates[0].taskId).toBe("a");
  });

  it("allows removing factors", () => {
    const withoutValue = DEFAULT_FACTORS.filter((f) => f.id !== "value");
    const result = evaluate(
      [
        task("a", { value: 100, confidence: 0.2 }),
        task("b", { value: 1, confidence: 0.9 }),
      ],
      withoutValue,
    );
    expect(result.candidates[0].taskId).toBe("b");
  });
});

describe("evaluateTasks — selectedTaskId", () => {
  it("selects the highest-ranked candidate", () => {
    const result = evaluate([
      task("a", { value: 10 }),
      task("b", { value: 5 }),
      task("c", { value: 1 }),
    ]);
    expect(result.selectedTaskId).toBe("a");
  });

  it("returns null when no candidates exist", () => {
    const result = evaluate([task("a", { status: "DONE" })]);
    expect(result.selectedTaskId).toBeNull();
  });
});

describe("evaluateTasks — mixed statuses", () => {
  it("correctly filters through a realistic scenario", () => {
    const result = evaluate([
      task("a", { status: "TODO", value: 5 }),
      task("b", { status: "DONE", value: 10 }),
      task("c", { status: "TODO", value: 8, dependencies: ["b"] }),
    ]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].taskId).toBe("c");
    expect(result.candidates[1].taskId).toBe("a");
  });
});

describe("evaluateTasks — immutability", () => {
  it("returns frozen result", () => {
    const result = evaluate([task("a", { value: 5 })]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.candidates)).toBe(true);
    expect(Object.isFrozen(result.candidates[0].factors)).toBe(true);
    expect(Object.isFrozen(result.maxValues)).toBe(true);
  });

  it("freezes every candidate evaluation and factor object", () => {
    const result = evaluate([task("a", { value: 5 }), task("b")]);
    expect(result.candidates.length).toBeGreaterThan(0);
    for (const candidate of result.candidates) {
      expect(Object.isFrozen(candidate)).toBe(true);
      for (const factor of candidate.factors) {
        expect(Object.isFrozen(factor)).toBe(true);
      }
    }
  });
});

describe("evaluateTasks — determinism", () => {
  it("produces identical results regardless of input order", () => {
    const tasks1 = [
      task("c", { value: 3 }),
      task("a", { value: 10 }),
      task("b", { value: 5 }),
    ];
    const tasks2 = [
      task("b", { value: 5 }),
      task("c", { value: 3 }),
      task("a", { value: 10 }),
    ];

    const result1 = evaluate(tasks1);
    const result2 = evaluate(tasks2);

    expect(result1.candidates.map((c) => c.taskId)).toEqual(
      result2.candidates.map((c) => c.taskId),
    );
    expect(result1.selectedTaskId).toBe(result2.selectedTaskId);
    for (const c1 of result1.candidates) {
      const c2 = result2.candidates.find((c) => c.taskId === c1.taskId)!;
      expect(c1.score).toBe(c2.score);
    }
  });
});
