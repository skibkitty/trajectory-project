import { describe, it, expect } from "vitest";
import { RecommendationService } from "./recommendation-service.js";
import type { Task } from "../domain/index.js";
import { createTask } from "../domain/index.js";
import { createStubRepository } from "../test-support/index.js";

function makeProject(tasks: Task[]) {
  return {
    id: "p1",
    name: "Test",
    description: "",
    tasks,
    goals: [],
  };
}

describe("RecommendationService", () => {
  describe("getRecommendation", () => {
    it("returns a recommendation for eligible tasks", async () => {
      const project = makeProject([
        createTask({ id: "a", title: "A", value: 10 }),
        createTask({ id: "b", title: "B", value: 5 }),
      ]);
      const repo = createStubRepository({ initialProject: project });
      const service = new RecommendationService(repo);

      const rec = await service.getRecommendation("p1");

      expect(rec.taskId).toBeDefined();
      expect(rec.score).toBeDefined();
      expect(rec.factors.length).toBeGreaterThan(0);
    });

    it("throws for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new RecommendationService(repo);

      await expect(service.getRecommendation("missing")).rejects.toThrow(
        "Project not found",
      );
    });
  });

  describe("getGraph", () => {
    it("returns tasks, graph, and schedule", async () => {
      const project = makeProject([
        createTask({ id: "a", title: "A", estimatedEffort: 3 }),
        createTask({
          id: "b",
          title: "B",
          estimatedEffort: 2,
          dependencies: ["a"],
        }),
      ]);
      const repo = createStubRepository({ initialProject: project });
      const service = new RecommendationService(repo);

      const result = await service.getGraph("p1");

      expect(result.tasks).toHaveLength(2);
      expect(result.graph.taskIds).toEqual(["a", "b"]);
      expect(result.schedule.projectDuration).toBe(5);
    });
  });
});
