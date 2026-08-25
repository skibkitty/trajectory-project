import { describe, it, expect } from "vitest";
import { GoalService } from "./goal-service.js";
import type { ProjectRepository, ProjectSummary } from "./repository.js";
import type { Project, Goal } from "../domain/index.js";
import { createGoal } from "../domain/index.js";

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

function makeProject(goals: Goal[] = []): Project {
  return {
    id: "p1",
    name: "Test",
    description: "",
    tasks: [],
    goals,
  };
}

describe("GoalService", () => {
  describe("addGoal", () => {
    it("adds a goal to the project", async () => {
      const repo = createStubRepository(makeProject());
      const service = new GoalService(repo);

      const goal = await service.addGoal("p1", {
        id: "g1",
        name: "Launch",
      });

      expect(goal.id).toBe("g1");
      expect(goal.name).toBe("Launch");

      const project = await repo.load("p1");
      expect(project!.goals).toHaveLength(1);
    });

    it("rejects duplicate goal ids", async () => {
      const repo = createStubRepository(
        makeProject([createGoal({ id: "g1", name: "Existing" })]),
      );
      const service = new GoalService(repo);

      await expect(
        service.addGoal("p1", { id: "g1", name: "Duplicate" }),
      ).rejects.toThrow("Goal already exists");
    });

    it("throws for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new GoalService(repo);

      await expect(
        service.addGoal("missing", { id: "g1", name: "Goal" }),
      ).rejects.toThrow("Project not found");
    });
  });

  describe("removeGoal", () => {
    it("removes a goal from the project", async () => {
      const project = makeProject([
        createGoal({ id: "g1", name: "Launch" }),
        createGoal({ id: "g2", name: "Ship" }),
      ]);
      const repo = createStubRepository(project);
      const service = new GoalService(repo);

      await service.removeGoal("p1", "g1");

      const loaded = await repo.load("p1");
      expect(loaded!.goals).toHaveLength(1);
      expect(loaded!.goals[0].id).toBe("g2");
    });

    it("throws for non-existent goal", async () => {
      const repo = createStubRepository(makeProject());
      const service = new GoalService(repo);

      await expect(service.removeGoal("p1", "missing")).rejects.toThrow(
        "Goal not found",
      );
    });
  });
});
