import { describe, it, expect } from "vitest";
import { createProject } from "./project.js";
import { createTask } from "./task.js";
import { createGoal } from "./goal.js";

describe("Project", () => {
  it("creates a project with required fields", () => {
    const project = createProject({ id: "p1", name: "Trajectory" });
    expect(project).toEqual({
      id: "p1",
      name: "Trajectory",
      description: "",
      tasks: [],
      goals: [],
    });
  });

  it("creates a project with tasks and goals", () => {
    const task = createTask({ id: "t1", title: "Implement feature" });
    const goal = createGoal({ id: "g1", name: "Ship MVP" });
    const project = createProject({
      id: "p1",
      name: "Trajectory",
      description: "A planning engine",
      tasks: [task],
      goals: [goal],
    });
    expect(project.tasks).toEqual([task]);
    expect(project.goals).toEqual([goal]);
    expect(project.description).toBe("A planning engine");
  });

  it("rejects empty id", () => {
    expect(() => createProject({ id: "", name: "Test" })).toThrow(
      "Project id is required",
    );
  });

  it("rejects empty name", () => {
    expect(() => createProject({ id: "p1", name: "" })).toThrow(
      "Project name is required",
    );
  });
});
