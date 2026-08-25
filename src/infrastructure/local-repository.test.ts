import { describe, it, expect } from "vitest";
import { LocalProjectRepository } from "./local-repository.js";
import {
  serialize,
  deserialize,
  CURRENT_SCHEMA_VERSION,
} from "./serialization.js";
import type { StorageProvider } from "./storage.js";
import { createProject, createTask, createGoal } from "../domain/index.js";

function createInMemoryStorage(): StorageProvider & {
  getInternal(key: string): string | null;
} {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    keys: () => Object.freeze([...store.keys()]),
    getInternal: (key: string) => store.get(key) ?? null,
  };
}

function sampleProject(): ReturnType<typeof createProject> {
  return createProject({
    id: "proj-1",
    name: "Test Project",
    description: "A test project",
    tasks: [
      createTask({
        id: "task-1",
        title: "First task",
        value: 10,
        urgency: 5,
        estimatedEffort: 3,
        confidence: 0.8,
      }),
      createTask({
        id: "task-2",
        title: "Second task",
        dependencies: ["task-1"],
        value: 20,
      }),
    ],
    goals: [
      createGoal({ id: "goal-1", name: "Goal One", description: "First goal" }),
    ],
  });
}

describe("Serialization", () => {
  it("round-trips a project through serialize and deserialize", () => {
    const project = sampleProject();
    const data = serialize(project);
    const restored = deserialize(data);

    expect(restored.id).toBe(project.id);
    expect(restored.name).toBe(project.name);
    expect(restored.description).toBe(project.description);
    expect(restored.tasks).toHaveLength(project.tasks.length);
    expect(restored.goals).toHaveLength(project.goals.length);
    expect(restored.tasks[0].id).toBe("task-1");
    expect(restored.tasks[0].value).toBe(10);
    expect(restored.tasks[0].urgency).toBe(5);
    expect(restored.tasks[0].estimatedEffort).toBe(3);
    expect(restored.tasks[0].confidence).toBe(0.8);
    expect(restored.tasks[1].dependencies).toEqual(["task-1"]);
    expect(restored.goals[0].name).toBe("Goal One");
  });

  it("includes schema version in serialized data", () => {
    const project = sampleProject();
    const data = serialize(project);
    expect(data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("rejects data with missing schemaVersion", () => {
    expect(() => deserialize({ id: "x", name: "X" })).toThrow(
      "missing schemaVersion",
    );
  });

  it("rejects data with older schema version", () => {
    const project = sampleProject();
    const data = { ...serialize(project), schemaVersion: 0 };
    expect(() => deserialize(data)).toThrow("older than current version");
  });

  it("rejects data with newer schema version", () => {
    const project = sampleProject();
    const data = { ...serialize(project), schemaVersion: 999 };
    expect(() => deserialize(data)).toThrow("newer than current version");
  });

  it("rejects non-object data", () => {
    expect(() => deserialize(null)).toThrow("expected an object");
    expect(() => deserialize("string")).toThrow("expected an object");
    expect(() => deserialize(42)).toThrow("expected an object");
  });

  it("rejects project with missing id", () => {
    const project = sampleProject();
    const data = { ...serialize(project), id: "" };
    expect(() => deserialize(data)).toThrow("missing or empty id");
  });

  it("rejects project with missing name", () => {
    const project = sampleProject();
    const data = { ...serialize(project), name: "" };
    expect(() => deserialize(data)).toThrow("missing or empty name");
  });

  it("rejects project with non-array tasks", () => {
    const project = sampleProject();
    const data = { ...serialize(project), tasks: "not-an-array" };
    expect(() => deserialize(data)).toThrow("tasks must be an array");
  });

  it("rejects project with non-array goals", () => {
    const project = sampleProject();
    const data = { ...serialize(project), goals: "not-an-array" };
    expect(() => deserialize(data)).toThrow("goals must be an array");
  });

  it("rejects task with missing id", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      tasks: [{ title: "No ID", status: "BACKLOG" }],
    };
    expect(() => deserialize(data)).toThrow(
      "Invalid task data: missing or empty id",
    );
  });

  it("rejects task with missing title", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      tasks: [{ id: "t1", status: "BACKLOG" }],
    };
    expect(() => deserialize(data)).toThrow(
      "Invalid task data: missing or empty title",
    );
  });

  it("rejects goal with missing id", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      goals: [{ name: "No ID" }],
    };
    expect(() => deserialize(data)).toThrow(
      "Invalid goal data: missing or empty id",
    );
  });

  it("rejects goal with missing name", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      goals: [{ id: "g1" }],
    };
    expect(() => deserialize(data)).toThrow(
      "Invalid goal data: missing or empty name",
    );
  });

  it("defaults missing task fields to domain defaults", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      tasks: [{ id: "minimal", title: "Minimal" }],
    };
    const restored = deserialize(data);
    const task = restored.tasks.find((t) => t.id === "minimal");
    expect(task).toBeDefined();
    expect(task!.status).toBe("BACKLOG");
    expect(task!.value).toBe(0);
    expect(task!.urgency).toBe(0);
    expect(task!.estimatedEffort).toBe(1);
    expect(task!.confidence).toBe(1);
    expect(task!.goalId).toBeNull();
    expect(task!.dependencies).toEqual([]);
  });

  it("defaults missing goal description to empty string", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      goals: [{ id: "g1", name: "Goal" }],
    };
    const restored = deserialize(data);
    const goal = restored.goals.find((g) => g.id === "g1");
    expect(goal).toBeDefined();
    expect(goal!.description).toBe("");
  });

  it("defaults missing project description to empty string", () => {
    const project = sampleProject();
    const data = { ...serialize(project) };
    const { description: _removed, ...dataWithoutDesc } =
      data as typeof data & { description: string };
    const restored = deserialize(dataWithoutDesc);
    expect(restored.description).toBe("");
  });

  it("rejects task data that is not an object", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      tasks: ["not-an-object"],
    };
    expect(() => deserialize(data)).toThrow(
      "Invalid task data: expected an object",
    );
  });

  it("rejects goal data that is not an object", () => {
    const project = sampleProject();
    const data = {
      ...serialize(project),
      goals: ["not-an-object"],
    };
    expect(() => deserialize(data)).toThrow(
      "Invalid goal data: expected an object",
    );
  });

  it("serializes frozen output", () => {
    const project = sampleProject();
    const data = serialize(project);
    expect(Object.isFrozen(data)).toBe(true);
    expect(Object.isFrozen(data.tasks)).toBe(true);
    expect(Object.isFrozen(data.goals)).toBe(true);
  });
});

describe("LocalProjectRepository", () => {
  it("saves and loads a project", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    const project = sampleProject();
    await repo.save(project);
    const loaded = await repo.load("proj-1");

    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe("proj-1");
    expect(loaded!.name).toBe("Test Project");
    expect(loaded!.tasks).toHaveLength(2);
    expect(loaded!.goals).toHaveLength(1);
  });

  it("returns null for non-existent project", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    const loaded = await repo.load("non-existent");
    expect(loaded).toBeNull();
  });

  it("lists projects sorted by id", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    await repo.save(
      createProject({
        id: "proj-b",
        name: "B Project",
        tasks: [createTask({ id: "t1", title: "T1" })],
      }),
    );
    await repo.save(
      createProject({
        id: "proj-a",
        name: "A Project",
        goals: [createGoal({ id: "g1", name: "G1" })],
      }),
    );

    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("proj-a");
    expect(list[1].id).toBe("proj-b");
    expect(list[0].taskCount).toBe(0);
    expect(list[0].goalCount).toBe(1);
    expect(list[1].taskCount).toBe(1);
    expect(list[1].goalCount).toBe(0);
  });

  it("returns empty list when no projects exist", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    const list = await repo.list();
    expect(list).toHaveLength(0);
  });

  it("deletes an existing project", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    await repo.save(sampleProject());
    const deleted = await repo.delete("proj-1");
    expect(deleted).toBe(true);

    const loaded = await repo.load("proj-1");
    expect(loaded).toBeNull();
  });

  it("returns false when deleting non-existent project", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    const deleted = await repo.delete("non-existent");
    expect(deleted).toBe(false);
  });

  it("overwrites project on re-save", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    await repo.save(createProject({ id: "proj-1", name: "Original" }));
    await repo.save(createProject({ id: "proj-1", name: "Updated" }));

    const loaded = await repo.load("proj-1");
    expect(loaded!.name).toBe("Updated");
  });

  it("stores projects with separate keys", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    await repo.save(createProject({ id: "proj-1", name: "First" }));
    await repo.save(createProject({ id: "proj-2", name: "Second" }));

    const loaded1 = await repo.load("proj-1");
    const loaded2 = await repo.load("proj-2");

    expect(loaded1!.name).toBe("First");
    expect(loaded2!.name).toBe("Second");
  });

  it("skips corrupted entries when listing", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    await repo.save(sampleProject());
    storage.setItem("trajectory:project:corrupted", "not-valid-json{");

    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("proj-1");
  });

  it("returns frozen list from list()", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    await repo.save(sampleProject());
    const list = await repo.list();
    expect(Object.isFrozen(list)).toBe(true);
  });

  it("round-trips through JSON serialization", async () => {
    const storage = createInMemoryStorage();
    const repo = new LocalProjectRepository(storage);

    const project = sampleProject();
    await repo.save(project);

    const rawJson = storage.getInternal("trajectory:project:proj-1");
    expect(rawJson).not.toBeNull();

    const parsed = JSON.parse(rawJson!);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(parsed.id).toBe("proj-1");
    expect(parsed.tasks).toHaveLength(2);

    const loaded = await repo.load("proj-1");
    expect(loaded!.tasks[0].title).toBe("First task");
  });
});
