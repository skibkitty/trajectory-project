import { describe, it, expect } from "vitest";
import { ScenarioService } from "./scenario-service.js";
import type { ProjectRepository, ProjectSummary } from "./repository.js";
import type { Project } from "../domain/index.js";
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
      const repo = createStubRepository(project);
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
