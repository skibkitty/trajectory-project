import { describe, it, expect } from "vitest";
import { RecommendationService } from "./recommendation-service.js";
import type { ProjectRepository, ProjectSummary } from "./repository.js";
import type { Project, Task } from "../domain/index.js";
import { createTask } from "../domain/index.js";

function createStubRepository(initialProject?: Project): ProjectRepository {
  const store = new Map<string, Project>();
  if (initialProject) {
    store.set(initialProject.id, initialProject);
  }
  return {
    save: async (project: Project) => {
      store.set(project.id, project);
    },
    load: async (id: string) => store.get(id) ?? null,
    list: async () => {
      const summaries: ProjectSummary[] = [];
      for (const [id, project] of store) {
        summaries.push({
          id,
          name: project.name,
          description: project.description,
          taskCount: project.tasks.length,
          goalCount: project.goals.length,
        });
      }
      return Object.freeze(summaries.sort((a, b) => a.id.localeCompare(b.id)));
    },
    delete: async (id: string) => {
      return store.delete(id);
    },
  };
}

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
      const repo = createStubRepository(project);
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
      const repo = createStubRepository(project);
      const service = new RecommendationService(repo);

      const result = await service.getGraph("p1");

      expect(result.tasks).toHaveLength(2);
      expect(result.graph.taskIds).toEqual(["a", "b"]);
      expect(result.schedule.projectDuration).toBe(5);
    });
  });
});
