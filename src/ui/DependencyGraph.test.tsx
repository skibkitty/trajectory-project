import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DependencyGraphVisualization } from "./DependencyGraph.js";
import { createTask } from "../domain/index.js";
import { createDependencyGraph } from "../domain/index.js";
import { calculateSchedule } from "../domain/index.js";

describe("DependencyGraphVisualization", () => {
  it("renders empty state when no tasks", () => {
    const tasks: ReturnType<typeof createTask>[] = [];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);

    render(
      <DependencyGraphVisualization
        tasks={tasks}
        graph={graph}
        schedule={schedule}
      />,
    );

    expect(screen.getByTestId("dependency-graph-empty")).toBeInTheDocument();
  });

  it("renders graph with nodes and edges", () => {
    const tasks = [
      createTask({ id: "a", title: "Task A" }),
      createTask({ id: "b", title: "Task B", dependencies: ["a"] }),
    ];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);

    render(
      <DependencyGraphVisualization
        tasks={tasks}
        graph={graph}
        schedule={schedule}
      />,
    );

    expect(screen.getByTestId("dependency-graph")).toBeInTheDocument();
    expect(screen.getByTestId("graph-svg")).toBeInTheDocument();
    expect(screen.getByTestId("graph-node-a")).toBeInTheDocument();
    expect(screen.getByTestId("graph-node-b")).toBeInTheDocument();
    expect(screen.getAllByTestId("graph-edge")).toHaveLength(1);
  });

  it("marks critical path nodes", () => {
    const tasks = [
      createTask({ id: "a", title: "A", estimatedEffort: 3 }),
      createTask({
        id: "b",
        title: "B",
        dependencies: ["a"],
        estimatedEffort: 2,
      }),
    ];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);

    render(
      <DependencyGraphVisualization
        tasks={tasks}
        graph={graph}
        schedule={schedule}
      />,
    );

    const nodeA = screen.getByTestId("graph-node-a");
    const nodeB = screen.getByTestId("graph-node-b");

    expect(nodeA).toHaveAttribute("data-critical", "true");
    expect(nodeB).toHaveAttribute("data-critical", "true");
  });

  it("shows legend", () => {
    const tasks = [createTask({ id: "a", title: "A" })];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);

    render(
      <DependencyGraphVisualization
        tasks={tasks}
        graph={graph}
        schedule={schedule}
      />,
    );

    expect(screen.getByTestId("graph-legend")).toBeInTheDocument();
  });
});
