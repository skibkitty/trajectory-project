import { describe, it, expect } from "vitest";
import { createTask } from "../task.js";
import type { Task } from "../task.js";
import { createDependencyGraph } from "./dependency-graph.js";

function task(id: string, dependencies: string[] = []): Task {
  return createTask({ id, title: id, dependencies });
}

function graph(...tasks: Task[]) {
  return createDependencyGraph(tasks);
}

describe("DependencyGraph construction", () => {
  it("creates an empty graph", () => {
    const g = graph();
    expect(g.taskIds).toEqual([]);
    expect(g.hasCycle()).toBe(false);
    expect(g.getCyclicTaskIds()).toEqual([]);
    expect(g.topologicalOrder()).toEqual([]);
  });

  it("creates a graph with a single task", () => {
    const g = graph(task("a"));
    expect(g.taskIds).toEqual(["a"]);
    expect(g.getPrerequisites("a")).toEqual([]);
    expect(g.getDependents("a")).toEqual([]);
    expect(g.topologicalOrder()).toEqual(["a"]);
  });

  it("rejects duplicate task ids", () => {
    expect(() => graph(task("a"), task("a"))).toThrow(
      "Task ids must be unique",
    );
  });

  it("rejects a dependency referencing an unknown task", () => {
    expect(() => graph(task("a", ["b"]))).toThrow(
      'Task "a" references unknown dependency "b"',
    );
  });

  it("deduplicates repeated dependency entries", () => {
    const a = createTask({ id: "a", title: "a", dependencies: ["b", "b"] });
    const b = task("b");
    const g = graph(a, b);
    expect(g.getPrerequisites("a")).toEqual(["b"]);
    expect(g.getDependents("b")).toEqual(["a"]);
    expect(g.topologicalOrder()).toEqual(["b", "a"]);
  });

  it("throws on unknown task lookup", () => {
    const g = graph(task("a"));
    expect(() => g.getPrerequisites("missing")).toThrow(
      'Unknown task "missing"',
    );
    expect(() => g.getDependents("missing")).toThrow('Unknown task "missing"');
  });
});

describe("prerequisite and dependent lookup", () => {
  it("returns direct prerequisites", () => {
    const g = graph(task("a", ["b", "c"]), task("b"), task("c"));
    expect(g.getPrerequisites("a")).toEqual(["b", "c"]);
  });

  it("returns direct dependents", () => {
    const g = graph(task("a", ["b"]), task("b", ["c"]), task("c"));
    expect(g.getDependents("a")).toEqual([]);
    expect(g.getDependents("b")).toEqual(["a"]);
    expect(g.getDependents("c")).toEqual(["b"]);
  });

  it("returns results sorted lexicographically", () => {
    const g = graph(task("z", ["m", "a"]), task("a"), task("m"));
    expect(g.getPrerequisites("z")).toEqual(["a", "m"]);
    expect(g.getDependents("a")).toEqual(["z"]);
  });
});

describe("traversal", () => {
  it("returns all transitive prerequisites", () => {
    const g = graph(
      task("d", ["c"]),
      task("c", ["b"]),
      task("b", ["a"]),
      task("a"),
    );
    expect(g.getAllPrerequisites("d")).toEqual(["a", "b", "c"]);
    expect(g.getAllPrerequisites("a")).toEqual([]);
  });

  it("returns all transitive dependents (downstream impact)", () => {
    const g = graph(
      task("a", []),
      task("b", ["a"]),
      task("c", ["a"]),
      task("d", ["b", "c"]),
    );
    expect(g.getAllDependents("a")).toEqual(["b", "c", "d"]);
    expect(g.getAllDependents("b")).toEqual(["d"]);
    expect(g.getAllDependents("d")).toEqual([]);
  });

  it("handles diamond-shaped dependencies", () => {
    const g = graph(
      task("root"),
      task("left", ["root"]),
      task("right", ["root"]),
      task("leaf", ["left", "right"]),
    );
    expect(g.getAllDependents("root")).toEqual(["leaf", "left", "right"]);
    expect(g.getAllPrerequisites("leaf")).toEqual(["left", "right", "root"]);
  });

  it("throws on unknown task in traversal", () => {
    const g = graph(task("a"));
    expect(() => g.getAllDependents("missing")).toThrow(
      'Unknown task "missing"',
    );
    expect(() => g.getAllPrerequisites("missing")).toThrow(
      'Unknown task "missing"',
    );
  });
});

describe("reachability", () => {
  it("detects direct reachability", () => {
    const g = graph(task("a", ["b"]), task("b"));
    expect(g.isReachable("b", "a")).toBe(true);
  });

  it("detects transitive reachability", () => {
    const g = graph(task("a"), task("b", ["a"]), task("c", ["b"]), task("d"));
    expect(g.isReachable("a", "c")).toBe(true);
    expect(g.isReachable("a", "d")).toBe(false);
  });

  it("only follows the dependency direction", () => {
    const g = graph(task("a", ["b"]), task("b"));
    expect(g.isReachable("b", "a")).toBe(true);
    expect(g.isReachable("a", "b")).toBe(false);
  });

  it("is false for the same task in an acyclic graph", () => {
    const g = graph(task("a"));
    expect(g.isReachable("a", "a")).toBe(false);
  });

  it("is true for the same task when it is part of a cycle", () => {
    const g = graph(task("a", ["b"]), task("b", ["a"]));
    expect(g.isReachable("a", "a")).toBe(true);
  });

  it("throws on unknown tasks", () => {
    const g = graph(task("a"));
    expect(() => g.isReachable("missing", "a")).toThrow(
      'Unknown task "missing"',
    );
    expect(() => g.isReachable("a", "missing")).toThrow(
      'Unknown task "missing"',
    );
  });
});

describe("cycle detection", () => {
  it("reports no cycle for an acyclic graph", () => {
    const g = graph(task("a", ["b"]), task("b"));
    expect(g.hasCycle()).toBe(false);
    expect(g.getCyclicTaskIds()).toEqual([]);
  });

  it("detects a two-node cycle", () => {
    const g = graph(task("a", ["b"]), task("b", ["a"]));
    expect(g.hasCycle()).toBe(true);
    expect(g.getCyclicTaskIds()).toEqual(["a", "b"]);
  });

  it("detects a three-node cycle", () => {
    const g = graph(task("a", ["b"]), task("b", ["c"]), task("c", ["a"]));
    expect(g.hasCycle()).toBe(true);
    expect(g.getCyclicTaskIds()).toEqual(["a", "b", "c"]);
  });

  it("detects multiple disjoint cycles", () => {
    const g = graph(
      task("a", ["b"]),
      task("b", ["a"]),
      task("c", ["d"]),
      task("d", ["c"]),
    );
    expect(g.hasCycle()).toBe(true);
    expect(g.getCyclicTaskIds()).toEqual(["a", "b", "c", "d"]);
  });

  it("excludes tasks downstream of a cycle from the cyclic set", () => {
    const g = graph(
      task("a", ["b"]),
      task("b", ["c"]),
      task("c", ["b"]),
      task("d", ["c"]),
    );
    expect(g.hasCycle()).toBe(true);
    expect(g.getCyclicTaskIds()).toEqual(["b", "c"]);
  });
});

describe("topological order", () => {
  it("orders a linear chain", () => {
    const g = graph(task("a"), task("b", ["a"]), task("c", ["b"]));
    expect(g.topologicalOrder()).toEqual(["a", "b", "c"]);
  });

  it("orders a diamond shape with prerequisites before dependents", () => {
    const g = graph(
      task("root"),
      task("left", ["root"]),
      task("right", ["root"]),
      task("leaf", ["left", "right"]),
    );
    const order = g.topologicalOrder();
    expect(order.indexOf("root")).toBeLessThan(order.indexOf("left"));
    expect(order.indexOf("root")).toBeLessThan(order.indexOf("right"));
    expect(order.indexOf("left")).toBeLessThan(order.indexOf("leaf"));
    expect(order.indexOf("right")).toBeLessThan(order.indexOf("leaf"));
  });

  it("orders disconnected components", () => {
    const g = graph(task("a"), task("b"), task("c", ["b"]));
    expect(g.topologicalOrder()).toEqual(["a", "b", "c"]);
  });

  it("breaks ties deterministically by task id", () => {
    const g = graph(task("b", ["d"]), task("c"), task("a"), task("d"));
    expect(g.topologicalOrder()).toEqual(["a", "c", "d", "b"]);
  });

  it("is deterministic regardless of input order", () => {
    const unordered = graph(
      task("c", ["a"]),
      task("b", ["a"]),
      task("e", ["d"]),
      task("d", ["b"]),
      task("a"),
    );
    const reversed = graph(
      task("a"),
      task("d", ["b"]),
      task("e", ["d"]),
      task("b", ["a"]),
      task("c", ["a"]),
    );
    expect(unordered.topologicalOrder()).toEqual(reversed.topologicalOrder());
  });

  it("throws on a cyclic graph and names the cyclic tasks", () => {
    const g = graph(task("a", ["b"]), task("b", ["c"]), task("c", ["a"]));
    expect(() => g.topologicalOrder()).toThrow(
      "Dependency graph contains a cycle involving tasks: a, b, c",
    );
  });
});
