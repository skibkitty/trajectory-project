import { describe, it, expect } from "vitest";
import { createTask } from "../domain/index.js";
import { createDependencyGraph } from "../domain/index.js";
import { calculateSchedule } from "../domain/index.js";
import { computeLayout } from "./graph-layout.js";

describe("graph-layout", () => {
  it("computes layout for a linear chain", () => {
    const tasks = [
      createTask({ id: "a", title: "A" }),
      createTask({ id: "b", title: "B", dependencies: ["a"] }),
      createTask({ id: "c", title: "C", dependencies: ["b"] }),
    ];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);
    const layout = computeLayout(tasks, graph, schedule);

    expect(layout.nodes).toHaveLength(3);
    expect(layout.edges).toHaveLength(2);

    const nodeA = layout.nodes.find((n) => n.taskId === "a");
    const nodeB = layout.nodes.find((n) => n.taskId === "b");
    const nodeC = layout.nodes.find((n) => n.taskId === "c");

    expect(nodeA?.layer).toBe(0);
    expect(nodeB?.layer).toBe(1);
    expect(nodeC?.layer).toBe(2);
  });

  it("computes layout for independent tasks in the same layer", () => {
    const tasks = [
      createTask({ id: "a", title: "A" }),
      createTask({ id: "b", title: "B" }),
    ];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);
    const layout = computeLayout(tasks, graph, schedule);

    const nodeA = layout.nodes.find((n) => n.taskId === "a");
    const nodeB = layout.nodes.find((n) => n.taskId === "b");

    expect(nodeA?.layer).toBe(0);
    expect(nodeB?.layer).toBe(0);
  });

  it("returns empty layout for empty tasks", () => {
    const tasks: ReturnType<typeof createTask>[] = [];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);
    const layout = computeLayout(tasks, graph, schedule);

    expect(layout.nodes).toHaveLength(0);
    expect(layout.edges).toHaveLength(0);
  });
});
