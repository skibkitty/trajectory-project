import { describe, it, expect } from "vitest";
import { DependencyService } from "./dependency-service.js";
import { createTask } from "../domain/index.js";
import { createStubRepository } from "../test-support/index.js";

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
      const repo = createStubRepository({ initialProject: project });
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
      const repo = createStubRepository({ initialProject: project });
      const service = new DependencyService(repo);

      const result = await service.addDependency("p1", "b", "a");
      expect(result.dependencies).toEqual(["a"]);

      const loaded = await repo.load("p1");
      expect(loaded!.tasks[1].dependencies).toEqual(["a"]);
    });

    it("throws for non-existent task", async () => {
      const project = makeProject([createTask({ id: "a", title: "A" })]);
      const repo = createStubRepository({ initialProject: project });
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
      const repo = createStubRepository({ initialProject: project });
      const service = new DependencyService(repo);

      const updated = await service.removeDependency("p1", "b", "a");
      expect(updated.dependencies).toEqual([]);
    });

    it("is idempotent for non-existent dependency", async () => {
      const project = makeProject([
        createTask({ id: "a", title: "A" }),
        createTask({ id: "b", title: "B" }),
      ]);
      const repo = createStubRepository({ initialProject: project });
      const service = new DependencyService(repo);

      const result = await service.removeDependency("p1", "b", "a");
      expect(result.dependencies).toEqual([]);
    });
  });
});
