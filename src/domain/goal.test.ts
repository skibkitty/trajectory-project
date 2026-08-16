import { describe, it, expect } from "vitest";
import { createGoal } from "./goal.js";

describe("Goal", () => {
  it("creates a goal with required fields", () => {
    const goal = createGoal({ id: "g1", name: "Ship MVP" });
    expect(goal).toEqual({
      id: "g1",
      name: "Ship MVP",
      description: "",
    });
  });

  it("creates a goal with optional description", () => {
    const goal = createGoal({
      id: "g1",
      name: "Ship MVP",
      description: "Launch the minimum viable product",
    });
    expect(goal.description).toBe("Launch the minimum viable product");
  });

  it("rejects empty id", () => {
    expect(() => createGoal({ id: "", name: "Test" })).toThrow(
      "Goal id is required",
    );
  });

  it("rejects empty name", () => {
    expect(() => createGoal({ id: "g1", name: "" })).toThrow(
      "Goal name is required",
    );
  });
});
