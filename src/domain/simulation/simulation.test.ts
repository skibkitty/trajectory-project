import { describe, it, expect } from "vitest";
import { createTask } from "../task.js";
import type { Task } from "../task.js";
import { simulateScenario, applyScenario } from "./simulation.js";
import type { Scenario } from "./simulation.js";

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

function chain(): Task[] {
  return [
    task("a", { estimatedEffort: 2 }),
    task("b", { estimatedEffort: 3, dependencies: ["a"] }),
    task("c", { estimatedEffort: 1, dependencies: ["b"] }),
  ];
}

describe("applyScenario — isolation", () => {
  it("never mutates the baseline task array or its elements", () => {
    const baseline = chain();
    const snapshot = JSON.stringify(baseline);
    const derived = applyScenario(baseline, {
      kind: "delay-task",
      taskId: "a",
      additionalEffort: 5,
    });
    expect(JSON.stringify(baseline)).toBe(snapshot);
    expect(baseline[0].estimatedEffort).toBe(2);
    expect(derived[0].estimatedEffort).toBe(7);
    expect(derived[0]).not.toBe(baseline[0]);
  });

  it("preserves object identity for untouched tasks", () => {
    const baseline = chain();
    const derived = applyScenario(baseline, {
      kind: "change-effort",
      taskId: "b",
      newEffort: 9,
    });
    expect(derived[1]).not.toBe(baseline[1]);
    expect(derived[0]).toBe(baseline[0]);
    expect(derived[2]).toBe(baseline[2]);
  });

  it("drops dependency edges to a removed task without mutating survivors", () => {
    const baseline = chain();
    const derived = applyScenario(baseline, {
      kind: "remove-task",
      taskId: "a",
    });
    expect(derived.map((t) => t.id)).toEqual(["b", "c"]);
    expect(derived[0].dependencies).toEqual([]);
    expect(baseline[1].dependencies).toEqual(["a"]);
  });
});

describe("simulateScenario — delay", () => {
  it("increases duration when the delayed task is on the critical path", () => {
    const result = simulateScenario(chain(), {
      kind: "delay-task",
      taskId: "a",
      additionalEffort: 4,
    });
    expect(result.baseline.projectDuration).toBe(6);
    expect(result.projected.projectDuration).toBe(10);
    expect(result.durationDelta).toBe(4);
  });

  it("does not change duration when the delayed task has slack", () => {
    const tasks = [
      task("critical", { estimatedEffort: 5 }),
      task("side", { estimatedEffort: 1 }),
      task("join", { dependencies: ["critical", "side"] }),
    ];
    const result = simulateScenario(tasks, {
      kind: "delay-task",
      taskId: "side",
      additionalEffort: 2,
    });
    expect(result.baseline.projectDuration).toBe(6);
    expect(result.projected.projectDuration).toBe(6);
    expect(result.durationDelta).toBe(0);
  });

  it("reports affected downstream tasks sorted and excludes unaffected branches", () => {
    const tasks = [
      task("root", { estimatedEffort: 1 }),
      task("left", { dependencies: ["root"], estimatedEffort: 5 }),
      task("right", { dependencies: ["root"], estimatedEffort: 2 }),
      task("leaf", {
        dependencies: ["left", "right"],
        estimatedEffort: 1,
      }),
    ];
    const result = simulateScenario(tasks, {
      kind: "delay-task",
      taskId: "left",
      additionalEffort: 1,
    });
    expect(result.affectedDownstreamTaskIds).toEqual(["leaf", "left"]);
  });

  it("supports fractional delays deterministically", () => {
    const result = simulateScenario(chain(), {
      kind: "delay-task",
      taskId: "b",
      additionalEffort: 1.5,
    });
    expect(result.durationDelta).toBe(1.5);
  });

  it("rejects unknown target and non-positive delays", () => {
    expect(() =>
      simulateScenario(chain(), {
        kind: "delay-task",
        taskId: "missing",
        additionalEffort: 1,
      }),
    ).toThrow('unknown task "missing"');
    expect(() =>
      simulateScenario(chain(), {
        kind: "delay-task",
        taskId: "a",
        additionalEffort: 0,
      }),
    ).toThrow("positive");
  });
});

describe("simulateScenario — effort change", () => {
  it("shortens the project when effort is reduced on a critical task", () => {
    const result = simulateScenario(chain(), {
      kind: "change-effort",
      taskId: "b",
      newEffort: 1,
    });
    expect(result.baseline.projectDuration).toBe(6);
    expect(result.projected.projectDuration).toBe(4);
    expect(result.durationDelta).toBe(-2);
  });

  it("rejects a non-positive newEffort", () => {
    expect(() =>
      simulateScenario(chain(), {
        kind: "change-effort",
        taskId: "b",
        newEffort: 0,
      }),
    ).toThrow("positive");
  });
});

describe("simulateScenario — removal", () => {
  it("reports removed value and recomputes schedule", () => {
    const tasks = [
      task("a", { value: 8, estimatedEffort: 2 }),
      task("b", { value: 3, dependencies: ["a"], estimatedEffort: 3 }),
    ];
    const result = simulateScenario(tasks, {
      kind: "remove-task",
      taskId: "a",
    });
    expect(result.valueRemoved).toBe(8);
    expect(result.scenarioTasks.map((t) => t.id)).toEqual(["b"]);
    expect(result.projected.projectDuration).toBe(3);
    expect(result.durationDelta).toBe(-2);
    expect(result.criticalPathChanged).toBe(true);
  });

  it("handles removing the only task", () => {
    const result = simulateScenario([task("solo")], {
      kind: "remove-task",
      taskId: "solo",
    });
    expect(result.scenarioTasks).toEqual([]);
    expect(result.projected.projectDuration).toBe(0);
    expect(result.projected.recommendedTaskId).toBeNull();
    expect(result.valueRemoved).toBe(0);
  });

  it("rejects removing an unknown task", () => {
    expect(() =>
      simulateScenario(chain(), { kind: "remove-task", taskId: "nope" }),
    ).toThrow('unknown task "nope"');
  });
});

describe("simulateScenario — recommendation comparison", () => {
  it("detects a recommendation change when the recommended task is removed", () => {
    const tasks = [task("top", { value: 10 }), task("second", { value: 4 })];
    const result = simulateScenario(tasks, {
      kind: "remove-task",
      taskId: "top",
    });
    expect(result.baseline.recommendedTaskId).toBe("top");
    expect(result.projected.recommendedTaskId).toBe("second");
    expect(result.recommendationChanged).toBe(true);
  });

  it("does not change the recommendation when a delay leaves ranking intact", () => {
    const tasks = [
      task("leader", { value: 10, estimatedEffort: 1 }),
      task("trailer", { value: 1, estimatedEffort: 1 }),
    ];
    const result = simulateScenario(tasks, {
      kind: "delay-task",
      taskId: "leader",
      additionalEffort: 5,
    });
    expect(result.baseline.recommendedTaskId).toBe("leader");
    expect(result.projected.recommendedTaskId).toBe("leader");
    expect(result.recommendationChanged).toBe(false);
  });

  it("keeps the recommendation stable when nothing relevant changes", () => {
    const result = simulateScenario(chain(), {
      kind: "delay-task",
      taskId: "c",
      additionalEffort: 1,
    });
    expect(result.baseline.recommendedTaskId).toBe("a");
    expect(result.projected.recommendedTaskId).toBe("a");
    expect(result.recommendationChanged).toBe(false);
  });

  it("exposes the derived scenario state for further inspection", () => {
    const result = simulateScenario(chain(), {
      kind: "delay-task",
      taskId: "a",
      additionalEffort: 2,
    });
    expect(result.scenarioTasks.length).toBe(3);
    expect(result.scenarioTasks[0].estimatedEffort).toBe(4);
  });
});

describe("simulateScenario — determinism and immutability", () => {
  it("produces identical results across repeated runs and input order", () => {
    const build = (): Task[] => [
      task("x", { value: 3, estimatedEffort: 2 }),
      task("y", { value: 5, dependencies: ["x"], estimatedEffort: 1 }),
    ];
    const scenario: Scenario = {
      kind: "delay-task",
      taskId: "x",
      additionalEffort: 3,
    };
    const r1 = simulateScenario(build(), scenario);
    const r2 = simulateScenario(build(), scenario);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));

    const reversed = [...build()].reverse();
    const r3 = simulateScenario(reversed, scenario);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r3));
  });

  it("leaves the baseline array completely unchanged after simulation", () => {
    const baseline = chain();
    const snapshot = JSON.stringify(baseline);
    simulateScenario(baseline, {
      kind: "remove-task",
      taskId: "b",
    });
    expect(JSON.stringify(baseline)).toBe(snapshot);
  });

  it("returns frozen structures", () => {
    const result = simulateScenario(chain(), {
      kind: "delay-task",
      taskId: "a",
      additionalEffort: 1,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.baseline)).toBe(true);
    expect(Object.isFrozen(result.projected)).toBe(true);
    expect(Object.isFrozen(result.affectedDownstreamTaskIds)).toBe(true);
    expect(Object.isFrozen(result.scenarioTasks)).toBe(true);
    expect(Object.isFrozen(result.baseline.criticalPath)).toBe(true);
  });
});
