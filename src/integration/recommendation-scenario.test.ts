import { describe, it, expect } from "vitest";
import { LocalProjectRepository } from "../infrastructure/local-repository.js";
import type { StorageProvider } from "../infrastructure/storage.js";
import { ProjectService } from "../application/project-service.js";
import { GoalService } from "../application/goal-service.js";
import { TaskService } from "../application/task-service.js";
import { DependencyService } from "../application/dependency-service.js";
import { RecommendationService } from "../application/recommendation-service.js";
import { ScenarioService } from "../application/scenario-service.js";
import { TaskStatus } from "../domain/index.js";
import { createSampleProject } from "../ui/sample-data.js";

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
    dependencyService: new DependencyService(repository),
    recommendationService: new RecommendationService(repository),
    scenarioService: new ScenarioService(repository),
  };
}

describe("sample project through the real stack (integration)", () => {
  it("seeds the sample project, recommends, and survives a del/change scenario intact", async () => {
    const services = createServices();
    const input = createSampleProject();
    await services.projectService.createProject(input);

    const rec = await services.recommendationService.getRecommendation(
      input.id,
    );
    expect(rec.taskId).not.toBeNull();
    expect(rec.factors.length).toBeGreaterThan(0);

    const graph = await services.recommendationService.getGraph(input.id);
    expect(graph.tasks).toHaveLength(8);
    expect(graph.schedule.criticalPath.length).toBeGreaterThan(0);

    const scenario = await services.scenarioService.runScenario(input.id, {
      kind: "delay-task",
      taskId: "t5",
      additionalEffort: 2,
    });
    expect(scenario.affectedDownstreamTaskIds.length).toBeGreaterThanOrEqual(0);

    const stillIntact = await services.repository.load(input.id);
    expect(stillIntact!.tasks).toHaveLength(8);
    expect(stillIntact!.tasks.find((t) => t.id === "t5")!.estimatedEffort).toBe(
      5,
    );
  });

  it("recommendation factors carry source metrics from persisted project state", async () => {
    const services = createServices();
    const input = createSampleProject();
    await services.projectService.createProject(input);

    const rec = await services.recommendationService.getRecommendation(
      input.id,
    );

    const tasks = input.tasks ?? [];
    const selected = rec.taskId!;
    const selectedTask = tasks.find((t) => t.id === selected);

    expect(selectedTask).toBeDefined();

    const valueFactor = rec.factors.find((f) => f.id === "value");
    expect(valueFactor).toBeDefined();
    expect(valueFactor!.sourceMetric).toContain(String(selectedTask!.value));

    const effortFactor = rec.factors.find((f) => f.id === "effort");
    expect(effortFactor).toBeDefined();
    expect(effortFactor!.sourceMetric).toContain(
      String(selectedTask!.estimatedEffort),
    );
  });

  it("completing the recommended task changes the next recommendation through persistence", async () => {
    const services = createServices();
    const input = createSampleProject();
    await services.projectService.createProject(input);

    const first = await services.recommendationService.getRecommendation(
      input.id,
    );
    expect(first.taskId).not.toBeNull();

    await services.taskService.updateTaskStatus(
      input.id,
      first.taskId!,
      TaskStatus.DONE,
    );

    const second = await services.recommendationService.getRecommendation(
      input.id,
    );
    expect(second.taskId).not.toBeNull();
    expect(second.taskId).not.toBe(first.taskId);
  });
});

describe("cross-service state sharing through one repository (integration)", () => {
  it("services observe each other's mutations because they share the repository", async () => {
    const repository = new LocalProjectRepository(createInMemoryStorage());
    const projectService = new ProjectService(repository);
    const goalService = new GoalService(repository);
    const taskService = new TaskService(repository);
    const dependencyService = new DependencyService(repository);
    const recommendationService = new RecommendationService(repository);

    await projectService.createProject({ id: "shared", name: "Shared" });

    await goalService.addGoal("shared", { id: "g-goal", name: "Goal" });
    await taskService.addTask("shared", {
      id: "core",
      title: "Core",
      status: TaskStatus.DONE,
    });
    await taskService.addTask("shared", {
      id: "feature",
      title: "Feature",
      dependencies: ["core"],
    });
    await dependencyService.addDependency("shared", "feature", "core");

    const rec = await recommendationService.getRecommendation("shared");
    expect(rec.taskId).toBe("feature");
    expect(rec.factors).toHaveLength(6);
  });

  it("tracks task and goal counts in project summaries across services", async () => {
    const repository = new LocalProjectRepository(createInMemoryStorage());
    const projectService = new ProjectService(repository);
    const goalService = new GoalService(repository);
    const taskService = new TaskService(repository);

    await projectService.createProject({ id: "counted", name: "Counted" });
    await goalService.addGoal("counted", { id: "g1", name: "G1" });
    await taskService.addTask("counted", { id: "t1", title: "T1" });
    await taskService.addTask("counted", { id: "t2", title: "T2" });

    const list = await projectService.listProjects();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("counted");
    expect(list[0].taskCount).toBe(2);
    expect(list[0].goalCount).toBe(1);
  });
});

describe("scenario comparison through the real stack (integration)", () => {
  it("compares baseline vs projected after a task delay", async () => {
    const services = createServices();
    await services.projectService.createProject({ id: "p1", name: "Compare" });
    await services.taskService.addTask("p1", {
      id: "a",
      title: "A",
      estimatedEffort: 1,
      status: TaskStatus.DONE,
    });
    await services.taskService.addTask("p1", {
      id: "b",
      title: "B",
      estimatedEffort: 1,
      dependencies: ["a"],
    });
    await services.taskService.addTask("p1", {
      id: "c",
      title: "C",
      estimatedEffort: 1,
      dependencies: ["b"],
    });

    const result = await services.scenarioService.runScenario("p1", {
      kind: "delay-task",
      taskId: "b",
      additionalEffort: 4,
    });

    expect(result.baseline.projectDuration).toBe(3);
    expect(result.projected.projectDuration).toBe(7);
    expect(result.durationDelta).toBe(4);
    expect(result.affectedDownstreamTaskIds).toContain("c");
  });

  it("reports removed value for a de-scope scenario", async () => {
    const services = createServices();
    await services.projectService.createProject({ id: "p1", name: "Scope" });
    await services.taskService.addTask("p1", {
      id: "a",
      title: "A",
      value: 7,
    });

    const result = await services.scenarioService.runScenario("p1", {
      kind: "remove-task",
      taskId: "a",
    });

    expect(result.valueRemoved).toBe(7);
    expect(result.scenarioTasks.map((t) => t.id)).not.toContain("a");
  });
});
