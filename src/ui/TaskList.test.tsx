import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TaskList } from "./TaskList.js";
import { RecommendationService } from "../application/recommendation-service.js";
import type { ProjectRepository } from "../application/repository.js";
import {
  createProject,
  createTask,
  createDependencyGraph,
  calculateSchedule,
} from "../domain/index.js";

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

describe("TaskList", () => {
  let repository: ProjectRepository;
  let recommendationService: RecommendationService;

  beforeEach(() => {
    repository = createStubRepository();
    recommendationService = new RecommendationService(repository);
  });

  it("renders task table with tasks from the project", async () => {
    const task1 = createTask({
      id: "t1",
      title: "Set up CI",
      status: "DONE",
      value: 5,
    });
    const task2 = createTask({
      id: "t2",
      title: "Build feature",
      status: "TODO",
      value: 8,
      dependencies: ["t1"],
    });

    const project = createProject({
      id: "proj-1",
      name: "Test",
      tasks: [task1, task2],
    });

    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <TaskList
        projectId="proj-1"
        recommendationService={recommendationService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Set up CI/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Build feature/)).toBeInTheDocument();
  });

  it("shows critical path status from schedule", async () => {
    const task1 = createTask({
      id: "t1",
      title: "Task A",
      status: "TODO",
      value: 5,
      estimatedEffort: 5,
    });
    const task2 = createTask({
      id: "t2",
      title: "Task B",
      status: "TODO",
      value: 3,
      estimatedEffort: 2,
    });

    const project = createProject({
      id: "proj-1",
      name: "Test",
      tasks: [task1, task2],
    });

    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <TaskList
        projectId="proj-1"
        recommendationService={recommendationService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Task A/)).toBeInTheDocument();
    });

    const graph = createDependencyGraph(project.tasks);
    const schedule = calculateSchedule(project.tasks, graph);
    const criticalTask = schedule.criticalPath[0];

    const row = screen.getByTestId(`task-row-${criticalTask}`);
    expect(row).toHaveTextContent("Yes");
  });

  it("shows error state when load fails", async () => {
    vi.mocked(repository.load).mockRejectedValue(
      new Error("Project not found: bad-id"),
    );

    render(
      <TaskList
        projectId="bad-id"
        recommendationService={recommendationService}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Project not found: bad-id",
      );
    });
  });
});
