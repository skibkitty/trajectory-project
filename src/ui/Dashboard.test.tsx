import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Dashboard } from "./Dashboard.js";
import { ProjectService } from "../application/project-service.js";
import { RecommendationService } from "../application/recommendation-service.js";
import type { ProjectRepository } from "../application/repository.js";
import type { ProjectSummary } from "../application/repository.js";
import type { Project } from "../domain/index.js";
import { createProject, createTask, createGoal } from "../domain/index.js";

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

describe("Dashboard", () => {
  let repository: ProjectRepository;
  let projectService: ProjectService;
  let recommendationService: RecommendationService;

  beforeEach(() => {
    repository = createStubRepository();
    projectService = new ProjectService(repository);
    recommendationService = new RecommendationService(repository);
  });

  it("renders the Trajectory heading", () => {
    render(
      <Dashboard
        projectService={projectService}
        recommendationService={recommendationService}
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
});
