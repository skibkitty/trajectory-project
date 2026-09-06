import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { TaskList } from "./TaskList.js";
import { RecommendationService } from "../application/recommendation-service.js";
import type { ProjectRepository } from "../application/repository.js";
import {
  createProject,
  createTask,
  createDependencyGraph,
  calculateSchedule,
  ALL_TASK_STATUSES,
} from "../domain/index.js";
import { createStubRepository } from "../test-support/index.js";

describe("TaskList", () => {
  let repository: ProjectRepository;
  let recommendationService: RecommendationService;

  beforeEach(() => {
    repository = createStubRepository();
    recommendationService = new RecommendationService(repository);
  });

  it("offers every domain task status in a row's status dropdown", async () => {
    const project = createProject({
      id: "proj-1",
      name: "Test",
      tasks: [createTask({ id: "t1", title: "A", status: "TODO" })],
    });
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <TaskList
        projectId="proj-1"
        recommendationService={recommendationService}
        onUpdateTaskStatus={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-status-t1")).toBeInTheDocument();
    });
    const select = screen.getByTestId("task-status-t1");
    const optionValues = within(select)
      .getAllByRole("option")
      .map((option) => (option as HTMLOptionElement).value);
    expect(optionValues).toEqual(ALL_TASK_STATUSES);
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
        onUpdateTaskStatus={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Set up CI/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Build feature/)).toBeInTheDocument();
  });

  it("renders a status control per task row", async () => {
    const task = createTask({ id: "t1", title: "A", status: "TODO" });
    const project = createProject({
      id: "proj-1",
      name: "Test",
      tasks: [task],
    });
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <TaskList
        projectId="proj-1"
        recommendationService={recommendationService}
        onUpdateTaskStatus={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-status-t1")).toBeInTheDocument();
    });
    expect(screen.getByTestId("task-status-t1")).toHaveValue("TODO");
  });

  it("calls onUpdateTaskStatus when row status changes", async () => {
    const task = createTask({ id: "t1", title: "A", status: "TODO" });
    const project = createProject({
      id: "proj-1",
      name: "Test",
      tasks: [task],
    });
    vi.mocked(repository.load).mockResolvedValue(project);
    const onUpdateTaskStatus = vi.fn();

    render(
      <TaskList
        projectId="proj-1"
        recommendationService={recommendationService}
        onUpdateTaskStatus={onUpdateTaskStatus}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-status-t1")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("task-status-t1"), {
      target: { value: "DONE" },
    });
    expect(onUpdateTaskStatus).toHaveBeenCalledWith("t1", "DONE");
  });

  it("reloads tasks when refreshToken changes", async () => {
    const project = createProject({
      id: "proj-1",
      name: "Test",
      tasks: [createTask({ id: "t1", title: "A", status: "TODO" })],
    });
    vi.mocked(repository.load).mockResolvedValue(project);

    const { rerender } = render(
      <TaskList
        projectId="proj-1"
        recommendationService={recommendationService}
        onUpdateTaskStatus={vi.fn()}
        refreshToken={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-row-t1")).toBeInTheDocument();
    });

    const { load } = repository;
    const callsBefore = vi.mocked(load).mock.calls.length;

    rerender(
      <TaskList
        projectId="proj-1"
        recommendationService={recommendationService}
        onUpdateTaskStatus={vi.fn()}
        refreshToken={1}
      />,
    );

    await waitFor(() => {
      expect(vi.mocked(load).mock.calls.length).toBeGreaterThan(callsBefore);
    });
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
        onUpdateTaskStatus={vi.fn()}
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
        onUpdateTaskStatus={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Project not found: bad-id",
      );
    });
  });
});
