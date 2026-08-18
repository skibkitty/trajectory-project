import { describe, it, expect } from "vitest";
import { createTask } from "../task.js";
import type { Task } from "../task.js";
import { createDependencyGraph } from "../graph/dependency-graph.js";
import { calculateSchedule } from "./schedule.js";

function task(id: string, effort: number, dependencies: string[] = []): Task {
  return createTask({ id, title: id, estimatedEffort: effort, dependencies });
}

function graph(...tasks: Task[]) {
  return createDependencyGraph(tasks);
}

function schedule(...tasks: Task[]) {
  return calculateSchedule(tasks, graph(...tasks));
}

function byId(schedules: ReturnType<typeof schedule>, id: string) {
  const found = schedules.taskSchedules.find((s) => s.taskId === id);
  if (found === undefined) {
    throw new Error(`No schedule for task "${id}"`);
  }
  return found;
}

describe("ScheduleResult — empty project", () => {
  it("returns zero duration and no schedules for an empty task set", () => {
    const result = schedule();
    expect(result.projectDuration).toBe(0);
    expect(result.taskSchedules).toEqual([]);
    expect(result.criticalPath).toEqual([]);
  });
});

describe("ScheduleResult — single task", () => {
  it("computes schedule for a single task with no dependencies", () => {
    const result = schedule(task("a", 5));
    expect(result.projectDuration).toBe(5);
    expect(byId(result, "a")).toEqual({
      taskId: "a",
      duration: 5,
      earliestStart: 0,
      earliestFinish: 5,
      latestStart: 0,
      latestFinish: 5,
      slack: 0,
      isCritical: true,
    });
    expect(result.criticalPath).toEqual(["a"]);
  });

  it("computes schedule for a single task with default effort of 1", () => {
    const result = schedule(createTask({ id: "a", title: "a" }));
    expect(result.projectDuration).toBe(1);
    expect(byId(result, "a").duration).toBe(1);
  });
});

describe("ScheduleResult — linear chain", () => {
  it("computes correct schedule for a -> b -> c", () => {
    const result = schedule(
      task("a", 2),
      task("b", 3, ["a"]),
      task("c", 1, ["b"]),
    );

    expect(result.projectDuration).toBe(6);

    expect(byId(result, "a")).toEqual({
      taskId: "a",
      duration: 2,
      earliestStart: 0,
      earliestFinish: 2,
      latestStart: 0,
      latestFinish: 2,
      slack: 0,
      isCritical: true,
    });

    expect(byId(result, "b")).toEqual({
      taskId: "b",
      duration: 3,
      earliestStart: 2,
      earliestFinish: 5,
      latestStart: 2,
      latestFinish: 5,
      slack: 0,
      isCritical: true,
    });

    expect(byId(result, "c")).toEqual({
      taskId: "c",
      duration: 1,
      earliestStart: 5,
      earliestFinish: 6,
      latestStart: 5,
      latestFinish: 6,
      slack: 0,
      isCritical: true,
    });

    expect(result.criticalPath).toEqual(["a", "b", "c"]);
  });
});

describe("ScheduleResult — diamond with slack", () => {
  it("computes correct slack on a non-critical branch", () => {
    // root(3) -> left(2) -> leaf(1)
    // root(3) -> right(1) -> leaf(1)
    // root->left->leaf = 6 (critical), root->right->leaf = 5 (has slack)
    const result = schedule(
      task("root", 3),
      task("left", 2, ["root"]),
      task("right", 1, ["root"]),
      task("leaf", 1, ["left", "right"]),
    );

    expect(result.projectDuration).toBe(6);

    expect(byId(result, "root")).toEqual({
      taskId: "root",
      duration: 3,
      earliestStart: 0,
      earliestFinish: 3,
      latestStart: 0,
      latestFinish: 3,
      slack: 0,
      isCritical: true,
    });

    expect(byId(result, "left")).toEqual({
      taskId: "left",
      duration: 2,
      earliestStart: 3,
      earliestFinish: 5,
      latestStart: 3,
      latestFinish: 5,
      slack: 0,
      isCritical: true,
    });

    expect(byId(result, "right")).toEqual({
      taskId: "right",
      duration: 1,
      earliestStart: 3,
      earliestFinish: 4,
      latestStart: 4,
      latestFinish: 5,
      slack: 1,
      isCritical: false,
    });

    expect(byId(result, "leaf")).toEqual({
      taskId: "leaf",
      duration: 1,
      earliestStart: 5,
      earliestFinish: 6,
      latestStart: 5,
      latestFinish: 6,
      slack: 0,
      isCritical: true,
    });

    expect(result.criticalPath).toEqual(["root", "left", "leaf"]);
  });
});

describe("ScheduleResult — independent tasks", () => {
  it("sets project duration to the longest independent task", () => {
    const result = schedule(task("a", 5), task("b", 3), task("c", 7));

    expect(result.projectDuration).toBe(7);

    expect(byId(result, "a")).toEqual({
      taskId: "a",
      duration: 5,
      earliestStart: 0,
      earliestFinish: 5,
      latestStart: 2,
      latestFinish: 7,
      slack: 2,
      isCritical: false,
    });

    expect(byId(result, "b")).toEqual({
      taskId: "b",
      duration: 3,
      earliestStart: 0,
      earliestFinish: 3,
      latestStart: 4,
      latestFinish: 7,
      slack: 4,
      isCritical: false,
    });

    expect(byId(result, "c")).toEqual({
      taskId: "c",
      duration: 7,
      earliestStart: 0,
      earliestFinish: 7,
      latestStart: 0,
      latestFinish: 7,
      slack: 0,
      isCritical: true,
    });

    expect(result.criticalPath).toEqual(["c"]);
  });
});

describe("ScheduleResult — converging paths", () => {
  it("correctly computes earliest start as max of prerequisites", () => {
    // a(4) -> c(2)
    // b(1) -> c(2)
    const result = schedule(
      task("a", 4),
      task("b", 1),
      task("c", 2, ["a", "b"]),
    );

    expect(result.projectDuration).toBe(6);

    expect(byId(result, "c")).toEqual({
      taskId: "c",
      duration: 2,
      earliestStart: 4,
      earliestFinish: 6,
      latestStart: 4,
      latestFinish: 6,
      slack: 0,
      isCritical: true,
    });

    expect(byId(result, "b")).toEqual({
      taskId: "b",
      duration: 1,
      earliestStart: 0,
      earliestFinish: 1,
      latestStart: 3,
      latestFinish: 4,
      slack: 3,
      isCritical: false,
    });

    expect(result.criticalPath).toEqual(["a", "c"]);
  });
});

describe("ScheduleResult — multiple critical paths", () => {
  it("identifies all tasks on equally-long paths as critical", () => {
    // a(3) -> c(2)
    // b(3) -> c(2)
    const result = schedule(
      task("a", 3),
      task("b", 3),
      task("c", 2, ["a", "b"]),
    );

    expect(result.projectDuration).toBe(5);
    expect(byId(result, "a").isCritical).toBe(true);
    expect(byId(result, "b").isCritical).toBe(true);
    expect(byId(result, "c").isCritical).toBe(true);
    expect(result.criticalPath).toEqual(["a", "b", "c"]);
  });
});

describe("ScheduleResult — two-node cycle", () => {
  it("throws when the graph contains a cycle", () => {
    const a = task("a", 2, ["b"]);
    const b = task("b", 3, ["a"]);
    const g = graph(a, b);
    expect(() => calculateSchedule([a, b], g)).toThrow(
      "Dependency graph contains a cycle",
    );
  });
});

describe("ScheduleResult — fractional effort", () => {
  it("handles non-integer durations", () => {
    const result = schedule(task("a", 1.5), task("b", 2.5, ["a"]));

    expect(result.projectDuration).toBe(4);
    expect(byId(result, "a").earliestStart).toBe(0);
    expect(byId(result, "a").earliestFinish).toBe(1.5);
    expect(byId(result, "b").earliestStart).toBe(1.5);
    expect(byId(result, "b").earliestFinish).toBe(4);
  });
});

describe("ScheduleResult — determinism", () => {
  it("produces identical results regardless of input order", () => {
    const tasks1 = [
      task("c", 2, ["a"]),
      task("a", 3),
      task("b", 1, ["a"]),
      task("d", 4, ["b", "c"]),
    ];
    const tasks2 = [
      task("d", 4, ["b", "c"]),
      task("a", 3),
      task("c", 2, ["a"]),
      task("b", 1, ["a"]),
    ];

    const result1 = calculateSchedule(tasks1, graph(...tasks1));
    const result2 = calculateSchedule(tasks2, graph(...tasks2));

    expect(result1.projectDuration).toBe(result2.projectDuration);
    expect(result1.criticalPath).toEqual(result2.criticalPath);
    for (const s of result1.taskSchedules) {
      expect(byId(result2, s.taskId)).toEqual(s);
    }
  });
});

describe("ScheduleResult — immutability", () => {
  it("returns frozen arrays so callers cannot corrupt internal state", () => {
    const result = schedule(task("a", 2), task("b", 3, ["a"]));

    expect(() => {
      (result.criticalPath as string[]).push("corrupted");
    }).toThrow();
    expect(result.criticalPath).toEqual(["a", "b"]);

    expect(() => {
      (result.taskSchedules as unknown[]).push({
        taskId: "corrupted",
        duration: 0,
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: 0,
        latestFinish: 0,
        slack: 0,
        isCritical: false,
      });
    }).toThrow();
    expect(result.taskSchedules).toHaveLength(2);
  });
});

describe("ScheduleResult — large linear chain", () => {
  it("computes correct schedule for a chain of 10 tasks", () => {
    const tasks: Task[] = [];
    for (let i = 0; i < 10; i++) {
      const deps = i > 0 ? [`t${i - 1}`] : [];
      tasks.push(task(`t${i}`, 1, deps));
    }

    const result = schedule(...tasks);

    expect(result.projectDuration).toBe(10);
    expect(result.criticalPath).toEqual(
      Array.from({ length: 10 }, (_, i) => `t${i}`),
    );
    for (const s of result.taskSchedules) {
      expect(s.slack).toBe(0);
      expect(s.isCritical).toBe(true);
    }
  });
});
