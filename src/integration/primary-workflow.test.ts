import { describe, it, expect } from "vitest";
import { LocalProjectRepository } from "../infrastructure/local-repository.js";
import type { StorageProvider } from "../infrastructure/storage.js";
import { ProjectService } from "../application/project-service.js";
import { TaskService } from "../application/task-service.js";
import { GoalService } from "../application/goal-service.js";
import { DependencyService } from "../application/dependency-service.js";
import { RecommendationService } from "../application/recommendation-service.js";
import { ScenarioService } from "../application/scenario-service.js";
import { createProject, createGoal, TaskStatus } from "../domain/index.js";
import type { Project } from "../domain/index.js";

function createInMemoryStorage(): StorageProvider {
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
  };
}

function createServices() {
  const repository = new LocalProjectRepository(createInMemoryStorage());
  return {
    repository,
    projectService: new ProjectService(repository),
    taskService: new TaskService(repository),
    goalService: new GoalService(repository),
    dependencyService: new DependencyService(repository),
    recommendationService: new RecommendationService(repository),
    scenarioService: new ScenarioService(repository),
  };
}

describe("primary user workflow (integration)", () => {
  it("supports create project -> add tasks/dependencies -> recommend -> partial completion", async () => {
    const services = createServices();

    await services.projectService.createProject({
      id: "p1",
      name: "Build app",
    });

    const goal = await services.goalService.addGoal("p1", {
      id: "g1",
      name: "Ship MVP",
    });
    expect(goal.name).toBe("Ship MVP");

    await services.taskService.addTask("p1", {
      id: "t1",
      title: "Scaffold",
      status: TaskStatus.TODO,
      value: 3,
      urgency: 2,
      estimatedEffort: 1,
      confidence: 1,
      goalId: "g1",
    });
    await services.taskService.addTask("p1", {
      id: "t2",
      title: "Auth",
      status: TaskStatus.TODO,
      value: 8,
      urgency: 7,
      estimatedEffort: 3,
      confidence: 0.8,
      goalId: "g1",
    });
    await services.taskService.addTask("p1", {
      id: "t3",
      title: "Dashboard",
      status: TaskStatus.BACKLOG,
      value: 9,
      urgency: 6,
      estimatedEffort: 2,
      confidence: 0.7,
      goalId: "g1",
    });
    await services.taskService.addTask("p1", {
      id: "t4",
      title: "Tests",
      status: TaskStatus.BACKLOG,
      value: 6,
      urgency: 3,
      estimatedEffort: 2,
      confidence: 0.9,
      goalId: "g1",
    });

    await services.dependencyService.addDependency("p1", "t2", "t1");
    await services.dependencyService.addDependency("p1", "t3", "t2");
    await services.dependencyService.addDependency("p1", "t4", "t3");

    const rec = await services.recommendationService.getRecommendation("p1");
    expect(rec.taskId).not.toBeNull();

    const graph = await services.recommendationService.getGraph("p1");
    expect(graph.schedule.criticalPath).toContain("t1");
    expect(graph.schedule.criticalPath).toContain("t2");

    await services.taskService.updateTaskStatus("p1", "t1", TaskStatus.DONE);
    const recAfter =
      await services.recommendationService.getRecommendation("p1");
    expect(recAfter.taskId).toBe("t2");
  });

  it("persists the full project through the repository and reloads it intact", async () => {
    const services = createServices();

    await services.projectService.createProject({ id: "p1", name: "Full" });
    await services.taskService.addTask("p1", {
      id: "t1",
      title: "Seed",
      status: TaskStatus.DONE,
      value: 4,
      urgency: 5,
      estimatedEffort: 1.5,
      confidence: 0.6,
      goalId: undefined,
    });

    const reloaded = await services.repository.load("p1");
    expect(reloaded).not.toBeNull();
    expect(reloaded!.tasks).toHaveLength(1);
    expect(reloaded!.tasks[0]).toMatchObject({
      id: "t1",
      status: "DONE",
      value: 4,
      urgency: 5,
      estimatedEffort: 1.5,
      confidence: 0.6,
    });
  });

  it("does not mutate the persisted baseline when running a scenario", async () => {
    const services = createServices();

    await services.projectService.createProject({ id: "p1", name: "Sim" });
    await services.taskService.addTask("p1", {
      id: "a",
      title: "A",
      estimatedEffort: 2,
      status: TaskStatus.DONE,
    });
    await services.taskService.addTask("p1", {
      id: "b",
      title: "B",
      estimatedEffort: 3,
      dependencies: ["a"],
    });

    const result = await services.scenarioService.runScenario("p1", {
      kind: "delay-task",
      taskId: "a",
      additionalEffort: 5,
    });

    expect(result.durationDelta).toBe(5);
    expect(result.projected.projectDuration).toBe(10);

    const after = (await services.repository.load("p1"))!;
    expect(after.tasks).toHaveLength(2);
    expect(after.tasks.find((t) => t.id === "a")!.estimatedEffort).toBe(2);
  });

  it("seeds goals and projects through services so serialization round-trips defaults", async () => {
    const repository = new LocalProjectRepository(createInMemoryStorage());
    const projectService = new ProjectService(repository);
    const goalService = new GoalService(repository);

    await projectService.createProject({
      id: "p-min",
      name: "Minimal",
      description: "A project built through services",
    });
    await goalService.addGoal("p-min", { id: "g-min", name: "Goal" });

    const project = await projectService.getProject("p-min");
    expect(project).not.toBeNull();
    expect(project!.id).toBe("p-min");

    const list = await projectService.listProjects();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("p-min");
    expect(list[0].goalCount).toBe(1);

    await projectService.deleteProject("p-min");
    expect(await projectService.getProject("p-min")).toBeNull();
  });

  it("rejects a cycle across the service and persistence boundary", async () => {
    const services = createServices();
    await services.projectService.createProject({ id: "p1", name: "Cycle" });
    await services.taskService.addTask("p1", { id: "x", title: "X" });
    await services.taskService.addTask("p1", {
      id: "y",
      title: "Y",
      dependencies: ["x"],
    });

    await expect(
      services.dependencyService.addDependency("p1", "x", "y"),
    ).rejects.toThrow("would create a cycle");

    const project = (await services.repository.load("p1"))!;
    expect(project.tasks.find((t) => t.id === "y")!.dependencies).toEqual([
      "x",
    ]);
    expect(project.tasks.find((t) => t.id === "x")!.dependencies).toEqual([]);
  });

  it("builds a project entirely from a persisted domain value and analyzes it", async () => {
    const repository = new LocalProjectRepository(createInMemoryStorage());
    const projectService = new ProjectService(repository);
    const recommendationService = new RecommendationService(repository);

    const goal = createGoal({ id: "g1", name: "Launch" });
    const project: Project = createProject({
      id: "built",
      name: "Prebuilt",
      description: "",
      goals: [goal],
      tasks: [
        {
          id: "t1",
          title: "Init",
          description: "",
          status: TaskStatus.DONE,
          value: 2,
          urgency: 2,
          estimatedEffort: 1,
          confidence: 1,
          goalId: "g1",
          dependencies: [],
        },
        {
          id: "t2",
          title: "Feature",
          description: "",
          status: TaskStatus.TODO,
          value: 8,
          urgency: 6,
          estimatedEffort: 3,
          confidence: 0.7,
          goalId: "g1",
          dependencies: ["t1"],
        },
      ],
    });

    await projectService.createProject({
      id: project.id,
      name: project.name,
      description: project.description,
      tasks: project.tasks,
      goals: project.goals,
    });

    const loaded = await repository.load("built");
    expect(loaded).not.toBeNull();
    expect(loaded!.tasks).toHaveLength(2);

    const rec = await recommendationService.getRecommendation("built");
    expect(rec.taskId).toBe("t2");
    expect(rec.factors).toHaveLength(6);
  });
});
