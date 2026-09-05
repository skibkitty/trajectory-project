import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
import { createStubRepository } from "../test-support/index.js";

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

describe("Dashboard", () => {
  let repository: ProjectRepository;
  let projectService: ProjectService;
  let recommendationService: RecommendationService;
  let taskService: TaskService;
  let dependencyService: DependencyService;
  let scenarioService: ScenarioService;

  beforeEach(() => {
    repository = createStubRepository();
    projectService = new ProjectService(repository);
    recommendationService = new RecommendationService(repository);
    taskService = new TaskService(repository);
    dependencyService = new DependencyService(repository);
    scenarioService = new ScenarioService(repository);
  });

  it("renders the Trajectory heading", () => {
    render(
      <Dashboard
        projectService={projectService}
        recommendationService={recommendationService}
        taskService={taskService}
        dependencyService={dependencyService}
        scenarioService={scenarioService}
      />,
    );
    expect(screen.getByText("Trajectory")).toBeInTheDocument();
  });

  it("loads and displays project list", async () => {
    const project = makeTestProject();
    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      description: project.description,
      taskCount: project.tasks.length,
      goalCount: project.goals.length,
    };

    vi.mocked(repository.list).mockResolvedValue([summary]);

    render(
      <Dashboard
        projectService={projectService}
        recommendationService={recommendationService}
        taskService={taskService}
        dependencyService={dependencyService}
        scenarioService={scenarioService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    });
  });

  it("shows recommendation when project is selected", async () => {
    const project = makeTestProject();
    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      description: project.description,
      taskCount: project.tasks.length,
      goalCount: project.goals.length,
    };

    vi.mocked(repository.list).mockResolvedValue([summary]);
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <Dashboard
        projectService={projectService}
        recommendationService={recommendationService}
        taskService={taskService}
        dependencyService={dependencyService}
        scenarioService={scenarioService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "proj-1" } });

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-panel")).toBeInTheDocument();
    });
  });

  it("displays factor breakdown for the recommendation", async () => {
    const project = makeTestProject();
    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      description: project.description,
      taskCount: project.tasks.length,
      goalCount: project.goals.length,
    };

    vi.mocked(repository.list).mockResolvedValue([summary]);
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <Dashboard
        projectService={projectService}
        recommendationService={recommendationService}
        taskService={taskService}
        dependencyService={dependencyService}
        scenarioService={scenarioService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "proj-1" } });

    await waitFor(() => {
      expect(screen.getByTestId("factor-breakdown")).toBeInTheDocument();
    });
  });

  it("shows a cycle detection error in the UI when a cycle is created", async () => {
    const project = createProject({
      id: "proj-cycles",
      name: "Cycle Project",
      description: "For cycle demo",
      tasks: [
        createTask({
          id: "t1",
          title: "Subtask",
          status: "TODO",
          value: 3,
        }),
        createTask({
          id: "t2",
          title: "Parent",
          status: "TODO",
          value: 8,
          dependencies: ["t1"],
        }),
      ],
    });
    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      description: project.description,
      taskCount: project.tasks.length,
      goalCount: project.goals.length,
    };

    vi.mocked(repository.list).mockResolvedValue([summary]);
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <Dashboard
        projectService={projectService}
        recommendationService={recommendationService}
        taskService={taskService}
        dependencyService={dependencyService}
        scenarioService={scenarioService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Cycle Project/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "proj-cycles" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("dependency-editor")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("dep-task-select"), {
      target: { value: "t1" },
    });
    fireEvent.change(screen.getByTestId("dep-prerequisite-select"), {
      target: { value: "t2" },
    });
    fireEvent.click(screen.getByTestId("add-dependency-button"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Adding dependency "t2" -> "t1" would create a cycle/,
      );
    });
  });

  it("updates the recommendation live when project state changes", async () => {
    const project = createProject({
      id: "proj-live",
      name: "Live Project",
      description: "For live updates",
      tasks: [
        createTask({
          id: "t1",
          title: "Done task",
          status: "DONE",
          value: 5,
        }),
      ],
    });
    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      description: project.description,
      taskCount: project.tasks.length,
      goalCount: project.goals.length,
    };

    let currentProject = project;
    vi.mocked(repository.list).mockResolvedValue([summary]);
    vi.mocked(repository.load).mockImplementation(async () => currentProject);
    vi.mocked(repository.save).mockImplementation(async (p) => {
      currentProject = p;
    });

    render(
      <Dashboard
        projectService={projectService}
        recommendationService={recommendationService}
        taskService={taskService}
        dependencyService={dependencyService}
        scenarioService={scenarioService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Live Project/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "proj-live" },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/No eligible tasks to recommend/),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("task-id-input"), {
      target: { value: "t2" },
    });
    fireEvent.change(screen.getByTestId("task-title-input"), {
      target: { value: "New eligible task" },
    });
    fireEvent.change(screen.getByTestId("task-status-input"), {
      target: { value: "BACKLOG" },
    });
    fireEvent.click(screen.getByTestId("add-task-button"));

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("recommendation-card")).toHaveTextContent("t2");
  });
});
