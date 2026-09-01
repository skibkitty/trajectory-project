import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Dashboard } from "./Dashboard.js";
import { ProjectService } from "../application/project-service.js";
import { RecommendationService } from "../application/recommendation-service.js";
import { TaskService } from "../application/task-service.js";
import { DependencyService } from "../application/dependency-service.js";
import { ScenarioService } from "../application/scenario-service.js";
import type { ProjectRepository } from "../application/repository.js";
import type { ProjectSummary } from "../application/repository.js";
import type { Project } from "../domain/index.js";
import { createProject, createTask, createGoal } from "../domain/index.js";
import { DependencyEditor } from "./DependencyEditor.js";
import { DependencyGraphVisualization } from "./DependencyGraph.js";
import { createDependencyGraph, calculateSchedule } from "../domain/index.js";

function createStubRepository(
  overrides: Partial<ProjectRepository> = {},
): ProjectRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function makeTestProject(): Project {
  const goal = createGoal({ id: "g1", name: "Ship MVP" });
  const task1 = createTask({
    id: "t1",
    title: "Set up CI",
    status: "DONE",
    value: 5,
    urgency: 3,
    estimatedEffort: 2,
    confidence: 0.9,
    goalId: "g1",
  });
  const task2 = createTask({
    id: "t2",
    title: "Build dashboard",
    status: "TODO",
    value: 8,
    urgency: 7,
    estimatedEffort: 5,
    confidence: 0.7,
    goalId: "g1",
    dependencies: ["t1"],
  });
  const task3 = createTask({
    id: "t3",
    title: "Write tests",
    status: "BACKLOG",
    value: 6,
    urgency: 4,
    estimatedEffort: 3,
    confidence: 0.8,
    dependencies: ["t2"],
  });
  return createProject({
    id: "proj-1",
    name: "Test Project",
    description: "A test project",
    tasks: [task1, task2, task3],
    goals: [goal],
  });
}

function makeServices(repository: ProjectRepository) {
  return {
    projectService: new ProjectService(repository),
    recommendationService: new RecommendationService(repository),
    taskService: new TaskService(repository),
    dependencyService: new DependencyService(repository),
    scenarioService: new ScenarioService(repository),
  };
}

function renderDashboard(repository: ProjectRepository) {
  const services = makeServices(repository);
  render(
    <Dashboard
      projectService={services.projectService}
      recommendationService={services.recommendationService}
      taskService={services.taskService}
      dependencyService={services.dependencyService}
      scenarioService={services.scenarioService}
    />,
  );
  return services;
}

function makeSingleProjectRepo(): {
  repository: ProjectRepository;
  summary: ProjectSummary;
  project: Project;
} {
  const project = makeTestProject();
  const summary: ProjectSummary = {
    id: project.id,
    name: project.name,
    description: project.description,
    taskCount: project.tasks.length,
    goalCount: project.goals.length,
  };
  const repository = createStubRepository({
    list: vi.fn().mockResolvedValue([summary]),
    load: vi.fn().mockResolvedValue(project),
  });
  return { repository, summary, project };
}

describe("Accessibility and UX", () => {
  it("provides a skip link targeting the main content landmark", () => {
    renderDashboard(makeSingleProjectRepo().repository);
    const skip = screen.getByText("Skip to main content");
    expect(skip).toHaveAttribute("href", "#main-content");
    expect(skip).toHaveClass("skip-link");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("labels the project actions region for assistive technology", () => {
    renderDashboard(makeSingleProjectRepo().repository);
    expect(
      screen.getByRole("region", { name: "Project actions" }),
    ).toBeInTheDocument();
  });

  it("renders a styled empty state when there are no projects", async () => {
    renderDashboard(createStubRepository());
    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      /No projects yet/,
    );
  });

  it("exposes loading feedback as a live status region", async () => {
    const project = makeTestProject();
    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      description: project.description,
      taskCount: project.tasks.length,
      goalCount: project.goals.length,
    };
    let resolveList: (v: readonly ProjectSummary[]) => void = () => {};
    const repository = createStubRepository({
      list: vi.fn().mockReturnValue(new Promise((res) => (resolveList = res))),
      load: vi.fn().mockResolvedValue(project),
    });
    renderDashboard(repository);
    expect(screen.getByRole("status")).toBeInTheDocument();
    resolveList([summary]);
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  it("annotates the dependency graph SVG as an image with a description", () => {
    const tasks = [createTask({ id: "t1", title: "A" })];
    const graph = createDependencyGraph(tasks);
    const schedule = calculateSchedule(tasks, graph);
    render(
      <DependencyGraphVisualization
        tasks={tasks}
        graph={graph}
        schedule={schedule}
      />,
    );
    const svg = screen.getByRole("img");
    expect(svg).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Dependency graph"),
    );
  });

  it("gives dependency remove buttons explicit accessible names", () => {
    const tasks = [
      createTask({ id: "t1", title: "A" }),
      createTask({ id: "t2", title: "B", dependencies: ["t1"] }),
    ];
    render(
      <DependencyEditor
        tasks={tasks}
        onAddDependency={vi.fn()}
        onRemoveDependency={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Remove dependency: t1 is prerequisite for t2",
      }),
    ).toBeInTheDocument();
  });
});
