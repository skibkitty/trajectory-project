import { describe, it, expect } from "vitest";
import { ProjectService } from "./project-service.js";
import type { ProjectRepository, ProjectSummary } from "./repository.js";
import type { Project } from "../domain/index.js";

function createStubRepository(
  overrides: Partial<ProjectRepository> = {},
): ProjectRepository {
  const store = new Map<string, Project>();
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
    ...overrides,
  };
}

describe("ProjectService", () => {
  describe("createProject", () => {
    it("creates and persists a project", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      const project = await service.createProject({
        id: "p1",
        name: "Test Project",
      });

      expect(project.id).toBe("p1");
      expect(project.name).toBe("Test Project");
      expect(project.tasks).toEqual([]);
      expect(project.goals).toEqual([]);
    });

    it("overwrites existing project with same id", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await service.createProject({ id: "p1", name: "First" });
      await service.createProject({ id: "p1", name: "Second" });

      const loaded = await service.getProject("p1");
      expect(loaded!.name).toBe("Second");
    });
  });

  describe("getProject", () => {
    it("returns null for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      expect(await service.getProject("missing")).toBeNull();
    });

    it("returns the persisted project", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await service.createProject({ id: "p1", name: "Test" });
      const loaded = await service.getProject("p1");
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe("Test");
    });
  });

  describe("updateProject", () => {
    it("updates name and description", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await service.createProject({ id: "p1", name: "Old" });

      const updated = await service.updateProject("p1", {
        name: "New",
        description: "Updated",
      });

      expect(updated.name).toBe("New");
      expect(updated.description).toBe("Updated");

      const loaded = await service.getProject("p1");
      expect(loaded!.name).toBe("New");
    });

    it("throws for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await expect(
        service.updateProject("missing", { name: "X" }),
      ).rejects.toThrow("Project not found");
    });
  });

  describe("deleteProject", () => {
    it("returns true when project exists", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await service.createProject({ id: "p1", name: "Test" });
      expect(await service.deleteProject("p1")).toBe(true);
      expect(await service.getProject("p1")).toBeNull();
    });

    it("returns false for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      expect(await service.deleteProject("missing")).toBe(false);
    });
  });
});
