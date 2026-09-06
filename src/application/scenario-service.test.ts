import { describe, it, expect } from "vitest";
import { ScenarioService } from "./scenario-service.js";
import { createTask } from "../domain/index.js";
import { createStubRepository } from "../test-support/index.js";

describe("ScenarioService", () => {
  describe("runScenario", () => {
    it("runs a delay-task scenario", async () => {
      const project = {
        id: "p1",
        name: "Test",
        description: "",
        tasks: [
          createTask({ id: "a", title: "A", estimatedEffort: 2 }),
          createTask({
            id: "b",
            title: "B",
            estimatedEffort: 3,
            dependencies: ["a"],
          }),
        ],
        goals: [],
      };
      const repo = createStubRepository({ initialProject: project });
      const service = new ScenarioService(repo);

      const result = await service.runScenario("p1", {
        kind: "delay-task",
        taskId: "a",
        additionalEffort: 5,
      });

      expect(result.baseline.projectDuration).toBe(5);
      expect(result.projected.projectDuration).toBe(10);
      expect(result.durationDelta).toBe(5);
    });

    it("throws for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new ScenarioService(repo);

      await expect(
        service.runScenario("missing", {
          kind: "delay-task",
          taskId: "a",
          additionalEffort: 1,
        }),
      ).rejects.toThrow("Project not found");
    });
  });
});
