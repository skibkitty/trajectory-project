import { describe, it, expect } from "vitest";
import { ProjectService } from "./project-service.js";
import { createSampleProject } from "../ui/sample-data.js";
import { createStubRepository } from "../test-support/index.js";

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

    it("rejects a duplicate project id with a descriptive error", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await service.createProject({ id: "p1", name: "First" });

      await expect(
        service.createProject({ id: "p1", name: "Second" }),
      ).rejects.toThrow("Project already exists: p1");
    });

    it("keeps the original project when a duplicate id is rejected", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await service.createProject({
        id: "p1",
        name: "First",
        description: "original",
      });

      await expect(
        service.createProject({ id: "p1", name: "Second" }),
      ).rejects.toThrow("Project already exists: p1");

      const loaded = await service.getProject("p1");
      expect(loaded!.name).toBe("First");
      expect(loaded!.description).toBe("original");
    });

    it("rejects re-seeding the sample project", async () => {
      const repo = createStubRepository();
      const service = new ProjectService(repo);
      await service.createProject(createSampleProject());

      await expect(
        service.createProject(createSampleProject()),
      ).rejects.toThrow("Project already exists: sample-project");

      const loaded = await service.getProject("sample-project");
      expect(loaded!.name).toBe("Trajectory Demo");
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
