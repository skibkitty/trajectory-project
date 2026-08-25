import { describe, it, expect } from "vitest";
import { TaskService } from "./task-service.js";
import type { ProjectRepository, ProjectSummary } from "./repository.js";
import type { Project, Task } from "../domain/index.js";
import { createTask, TaskStatus } from "../domain/index.js";

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

function makeProject(tasks: Task[] = []): Project {
  return {
    id: "p1",
    name: "Test",
    description: "",
    tasks,
    goals: [],
  };
}

describe("TaskService", () => {
  describe("addTask", () => {
    it("adds a task to the project", async () => {
      const repo = createStubRepository(makeProject());
      const service = new TaskService(repo);

      const task = await service.addTask("p1", {
        id: "t1",
        title: "First task",
      });

      expect(task.id).toBe("t1");
      expect(task.title).toBe("First task");

      const project = await repo.load("p1");
      expect(project!.tasks).toHaveLength(1);
      expect(project!.tasks[0].id).toBe("t1");
    });

    it("rejects duplicate task ids", async () => {
      const repo = createStubRepository(
        makeProject([createTask({ id: "t1", title: "Existing" })]),
      );
      const service = new TaskService(repo);

      await expect(
        service.addTask("p1", { id: "t1", title: "Duplicate" }),
      ).rejects.toThrow("Task already exists");
    });

    it("throws for non-existent project", async () => {
      const repo = createStubRepository();
      const service = new TaskService(repo);

      await expect(
        service.addTask("missing", { id: "t1", title: "Task" }),
      ).rejects.toThrow("Project not found");
    });
  });

  describe("updateTaskStatus", () => {
    it("updates task status", async () => {
      const project = makeProject([
        createTask({ id: "t1", title: "Task", status: TaskStatus.BACKLOG }),
      ]);
      const repo = createStubRepository(project);
      const service = new TaskService(repo);

      const updated = await service.updateTaskStatus(
        "p1",
        "t1",
        TaskStatus.IN_PROGRESS,
      );

      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);

      const loaded = await repo.load("p1");
      expect(loaded!.tasks[0].status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("throws for non-existent task", async () => {
      const repo = createStubRepository(makeProject());
      const service = new TaskService(repo);

      await expect(
        service.updateTaskStatus("p1", "missing", TaskStatus.DONE),
      ).rejects.toThrow("Task not found");
    });
  });

  describe("removeTask", () => {
    it("removes a task and strips its references from dependencies", async () => {
      const project = makeProject([
        createTask({ id: "t1", title: "A" }),
        createTask({ id: "t2", title: "B", dependencies: ["t1"] }),
        createTask({ id: "t3", title: "C", dependencies: ["t1", "t2"] }),
      ]);
      const repo = createStubRepository(project);
      const service = new TaskService(repo);

      await service.removeTask("p1", "t1");

      const loaded = await repo.load("p1");
      expect(loaded!.tasks).toHaveLength(2);
      expect(loaded!.tasks.map((t) => t.id)).toEqual(["t2", "t3"]);
      expect(loaded!.tasks[0].dependencies).toEqual([]);
      expect(loaded!.tasks[1].dependencies).toEqual(["t2"]);
    });

    it("throws for non-existent task", async () => {
      const repo = createStubRepository(makeProject());
      const service = new TaskService(repo);

      await expect(service.removeTask("p1", "missing")).rejects.toThrow(
        "Task not found",
      );
    });
  });

  describe("getTask", () => {
    it("returns the task when it exists", async () => {
      const project = makeProject([createTask({ id: "t1", title: "Task" })]);
      const repo = createStubRepository(project);
      const service = new TaskService(repo);

      const task = await service.getTask("p1", "t1");
      expect(task).not.toBeNull();
      expect(task!.id).toBe("t1");
    });

    it("returns null for non-existent task", async () => {
      const repo = createStubRepository(makeProject());
      const service = new TaskService(repo);

      expect(await service.getTask("p1", "missing")).toBeNull();
    });
  });
});
