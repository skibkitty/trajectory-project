import { describe, it, expect } from "vitest";
import { DependencyService } from "./dependency-service.js";
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

function makeProject(tasks: ReturnType<typeof createTask>[]) {
  return {
    id: "p1",
    name: "Test",
    description: "",
    tasks,
    goals: [],
  };
}

describe("DependencyService", () => {
  describe("addDependency", () => {
    it("adds a prerequisite dependency", async () => {
      const project = makeProject([
        createTask({ id: "a", title: "A" }),
        createTask({ id: "b", title: "B" }),
      ]);
      const repo = createStubRepository(project);
      const service = new DependencyService(repo);

      const updated = await service.addDependency("p1", "b", "a");

      expect(updated.dependencies).toEqual(["a"]);

      const loaded = await repo.load("p1");
      expect(loaded!.tasks[1].dependencies).toEqual(["a"]);
    });

    it("is idempotent for existing dependency", async () => {
      const project = makeProject([
        createTask({ id: "a", title: "A" }),
        createTask({ id: "b", title: "B", dependencies: ["a"] }),
      ]);
      const repo = createStubRepository(project);
      const service = new DependencyService(repo);

      const result = await service.addDependency("p1", "b", "a");
      expect(result.dependencies).toEqual(["a"]);

      const loaded = await repo.load("p1");
      expect(loaded!.tasks[1].dependencies).toEqual(["a"]);
    });

    it("throws for non-existent task", async () => {
      const project = makeProject([createTask({ id: "a", title: "A" })]);
      const repo = createStubRepository(project);
      const service = new DependencyService(repo);

      await expect(service.addDependency("p1", "missing", "a")).rejects.toThrow(
        "Task not found",
      );
    });

    it("throws for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new DependencyService(repo);

      await expect(service.addDependency("missing", "b", "a")).rejects.toThrow(
        "Project not found",
      );
    });
  });

  describe("removeDependency", () => {
    it("removes a prerequisite dependency", async () => {
      const project = makeProject([
        createTask({ id: "a", title: "A" }),
        createTask({ id: "b", title: "B", dependencies: ["a"] }),
      ]);
      const repo = createStubRepository(project);
      const service = new DependencyService(repo);

      const updated = await service.removeDependency("p1", "b", "a");
      expect(updated.dependencies).toEqual([]);
    });

    it("is idempotent for non-existent dependency", async () => {
      const project = makeProject([
        createTask({ id: "a", title: "A" }),
        createTask({ id: "b", title: "B" }),
      ]);
      const repo = createStubRepository(project);
      const service = new DependencyService(repo);

      const result = await service.removeDependency("p1", "b", "a");
      expect(result.dependencies).toEqual([]);
    });
  });
});
