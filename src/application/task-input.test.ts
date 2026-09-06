import { describe, it, expect } from "vitest";
import { createTask } from "../domain/index.js";
import { toCreateTaskInput } from "./task-input.js";

describe("toCreateTaskInput", () => {
  it("round-trips every task field without loss", () => {
    const task = createTask({
      id: "t1",
      title: "Build feature",
      description: "Core feature",
      status: "IN_PROGRESS",
      value: 8,
      urgency: 6,
      estimatedEffort: 4,
      confidence: 0.7,
      goalId: "g1",
      dependencies: ["t0"],
    });

    const input = toCreateTaskInput(task);
    expect(input).toEqual({
      id: "t1",
      title: "Build feature",
      description: "Core feature",
      status: "IN_PROGRESS",
      value: 8,
      urgency: 6,
      estimatedEffort: 4,
      confidence: 0.7,
      goalId: "g1",
      dependencies: ["t0"],
    });

    // Rebuilding through the domain factory preserves the original task.
    expect(createTask(input)).toEqual(task);
  });

  it("converts goalId null to undefined so createTask yields the same null", () => {
    const task = createTask({ id: "t1", title: "No goal", goalId: "g1" });
    const withoutGoal = createTask({
      ...toCreateTaskInput(task),
      goalId: undefined,
    });
    // Removing the goal reference leaves the domain's "no goal" representation.
    expect(withoutGoal.goalId).toBeNull();

    const noGoalTask = createTask({ id: "t2", title: "Plain" });
    expect(toCreateTaskInput(noGoalTask).goalId).toBeUndefined();
    expect(createTask(toCreateTaskInput(noGoalTask)).goalId).toBeNull();
  });
});
