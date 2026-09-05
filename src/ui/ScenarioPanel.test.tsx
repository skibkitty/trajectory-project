import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ScenarioPanel } from "./ScenarioPanel.js";
import { ScenarioService } from "../application/scenario-service.js";
import type { ProjectRepository } from "../application/repository.js";
import type { Project } from "../domain/index.js";
import { createProject, createTask } from "../domain/index.js";
import { createStubRepository } from "../test-support/index.js";

function makeTestProject(): Project {
  const task1 = createTask({
    id: "t1",
    title: "Foundations",
    status: "DONE",
    value: 5,
    urgency: 3,
    estimatedEffort: 2,
    confidence: 0.9,
  });
  const task2 = createTask({
    id: "t2",
    title: "Build feature",
    status: "TODO",
    value: 8,
    urgency: 7,
    estimatedEffort: 5,
    confidence: 0.7,
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
    goals: [],
  });
}

describe("ScenarioPanel", () => {
  let repository: ProjectRepository;
  let scenarioService: ScenarioService;

  beforeEach(() => {
    repository = createStubRepository();
    scenarioService = new ScenarioService(repository);
  });

  it("renders the scenario builder controls", () => {
    const project = makeTestProject();
    render(
      <ScenarioPanel
        projectId="proj-1"
        scenarioService={scenarioService}
        tasks={project.tasks}
      />,
    );

    expect(screen.getByTestId("scenario-kind-select")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-task-select")).toBeInTheDocument();
    expect(screen.getByTestId("run-scenario-button")).toBeInTheDocument();
  });

  it("requires selecting a task before running", async () => {
    const project = makeTestProject();
    vi.mocked(repository.load).mockResolvedValue(project);
    render(
      <ScenarioPanel
        projectId="proj-1"
        scenarioService={scenarioService}
        tasks={project.tasks}
      />,
    );

    fireEvent.click(screen.getByTestId("run-scenario-button"));

    await waitFor(() => {
      expect(screen.getByTestId("scenario-error")).toHaveTextContent(
        /Select a task/,
      );
    });
  });

  it("runs a delay scenario and shows a baseline vs. projected comparison", async () => {
    const project = makeTestProject();
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <ScenarioPanel
        projectId="proj-1"
        scenarioService={scenarioService}
        tasks={project.tasks}
      />,
    );

    fireEvent.change(screen.getByTestId("scenario-task-select"), {
      target: { value: "t2" },
    });
    fireEvent.change(screen.getByTestId("scenario-amount-input"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByTestId("run-scenario-button"));

    await waitFor(() => {
      expect(screen.getByTestId("scenario-comparison")).toBeInTheDocument();
    });

    expect(screen.getByTestId("duration-delta")).toHaveTextContent("+10");
  });

  it("shows affected downstream tasks in the comparison", async () => {
    const project = makeTestProject();
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <ScenarioPanel
        projectId="proj-1"
        scenarioService={scenarioService}
        tasks={project.tasks}
      />,
    );

    fireEvent.change(screen.getByTestId("scenario-task-select"), {
      target: { value: "t2" },
    });
    fireEvent.change(screen.getByTestId("scenario-amount-input"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByTestId("run-scenario-button"));

    await waitFor(() => {
      expect(screen.getByTestId("scenario-comparison")).toBeInTheDocument();
    });

    const downstream = screen.getByTestId("affected-downstream");
    expect(downstream).toHaveTextContent("t2");
    expect(downstream).toHaveTextContent("t3");
  });

  it("shows value removed when de-scoping a task", async () => {
    const project = makeTestProject();
    vi.mocked(repository.load).mockResolvedValue(project);

    render(
      <ScenarioPanel
        projectId="proj-1"
        scenarioService={scenarioService}
        tasks={project.tasks}
      />,
    );

    fireEvent.change(screen.getByTestId("scenario-kind-select"), {
      target: { value: "remove-task" },
    });
    fireEvent.change(screen.getByTestId("scenario-task-select"), {
      target: { value: "t2" },
    });
    fireEvent.click(screen.getByTestId("run-scenario-button"));

    await waitFor(() => {
      expect(screen.getByTestId("scenario-comparison")).toBeInTheDocument();
    });

    expect(screen.getByTestId("value-removed")).toHaveTextContent("8");
  });

  it("rejects a non-positive delay amount", async () => {
    const project = makeTestProject();
    vi.mocked(repository.load).mockResolvedValue(project);
    render(
      <ScenarioPanel
        projectId="proj-1"
        scenarioService={scenarioService}
        tasks={project.tasks}
      />,
    );

    fireEvent.change(screen.getByTestId("scenario-task-select"), {
      target: { value: "t2" },
    });
    fireEvent.change(screen.getByTestId("scenario-amount-input"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByTestId("run-scenario-button"));

    await waitFor(() => {
      expect(screen.getByTestId("scenario-error")).toHaveTextContent(
        /positive/,
      );
    });
  });
});
