import { describe, it, expect } from "vitest";
import { createTask } from "./task.js";
import { TaskStatus } from "./task-status.js";

describe("Task", () => {
  it("creates a task with required fields", () => {
    const task = createTask({ id: "t1", title: "Implement feature" });
    expect(task).toEqual({
      id: "t1",
      title: "Implement feature",
      description: "",
      status: TaskStatus.BACKLOG,
      value: 0,
      urgency: 0,
      estimatedEffort: 1,
      confidence: 1,
      goalId: null,
      dependencies: [],
    });
  });

  it("creates a task with all optional fields", () => {
    const task = createTask({
      id: "t1",
      title: "Implement feature",
      description: "Build the feature",
      status: TaskStatus.IN_PROGRESS,
      value: 10,
      urgency: 5,
      estimatedEffort: 3,
      confidence: 0.8,
      goalId: "g1",
      dependencies: ["t0"],
    });
    expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    expect(task.value).toBe(10);
    expect(task.urgency).toBe(5);
    expect(task.estimatedEffort).toBe(3);
    expect(task.confidence).toBe(0.8);
    expect(task.goalId).toBe("g1");
    expect(task.dependencies).toEqual(["t0"]);
  });

  it("rejects empty id", () => {
    expect(() => createTask({ id: "", title: "Test" })).toThrow(
      "Task id is required",
    );
  });

  it("rejects empty title", () => {
    expect(() => createTask({ id: "t1", title: "" })).toThrow(
      "Task title is required",
    );
  });

  it("rejects negative value", () => {
    expect(() => createTask({ id: "t1", title: "Test", value: -1 })).toThrow(
      "Task value must be non-negative",
    );
  });

  it("rejects negative urgency", () => {
    expect(() => createTask({ id: "t1", title: "Test", urgency: -1 })).toThrow(
      "Task urgency must be non-negative",
    );
  });

  it("rejects non-positive estimated effort", () => {
    expect(() =>
      createTask({ id: "t1", title: "Test", estimatedEffort: 0 }),
    ).toThrow("Task estimated effort must be positive");
    expect(() =>
      createTask({ id: "t1", title: "Test", estimatedEffort: -1 }),
    ).toThrow("Task estimated effort must be positive");
  });

  it("rejects confidence outside 0-1 range", () => {
    expect(() =>
      createTask({ id: "t1", title: "Test", confidence: -0.1 }),
    ).toThrow("Task confidence must be between 0 and 1");
    expect(() =>
      createTask({ id: "t1", title: "Test", confidence: 1.1 }),
    ).toThrow("Task confidence must be between 0 and 1");
  });

  it("accepts confidence at boundaries", () => {
    const task0 = createTask({
      id: "t1",
      title: "Test",
      confidence: 0,
    });
    expect(task0.confidence).toBe(0);

    const task1 = createTask({
      id: "t2",
      title: "Test",
      confidence: 1,
    });
    expect(task1.confidence).toBe(1);
  });

  it("rejects self-dependency", () => {
    expect(() =>
      createTask({ id: "t1", title: "Test", dependencies: ["t1"] }),
    ).toThrow("Task cannot depend on itself");
  });

  it("allows zero value", () => {
    const task = createTask({ id: "t1", title: "Test", value: 0 });
    expect(task.value).toBe(0);
  });

  it("allows zero urgency", () => {
    const task = createTask({ id: "t1", title: "Test", urgency: 0 });
    expect(task.urgency).toBe(0);
  });
});
