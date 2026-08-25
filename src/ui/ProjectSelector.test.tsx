import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectSelector } from "./ProjectSelector.js";
import type { ProjectSummary } from "../application/repository.js";

const mockProjects: readonly ProjectSummary[] = [
  {
    id: "proj-1",
    name: "Alpha",
    description: "First project",
    taskCount: 5,
    goalCount: 2,
  },
  {
    id: "proj-2",
    name: "Beta",
    description: "Second project",
    taskCount: 12,
    goalCount: 3,
  },
];

describe("ProjectSelector", () => {
  it("renders a select element with project options", () => {
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId={null}
        onSelectProject={vi.fn()}
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/Beta/)).toBeInTheDocument();
  });

  it("calls onSelectProject when a project is chosen", async () => {
    const onSelect = vi.fn();

    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId={null}
        onSelectProject={onSelect}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "proj-2" } });

    expect(onSelect).toHaveBeenCalledWith("proj-2");
  });

  it("shows task counts in options", () => {
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId={null}
        onSelectProject={vi.fn()}
      />,
    );

    expect(screen.getByText(/Alpha \(5 tasks\)/)).toBeInTheDocument();
    expect(screen.getByText(/Beta \(12 tasks\)/)).toBeInTheDocument();
  });

  it("renders with no projects", () => {
    render(
      <ProjectSelector
        projects={[]}
        selectedProjectId={null}
        onSelectProject={vi.fn()}
      />,
    );

    expect(screen.getByText(/-- choose a project --/)).toBeInTheDocument();
  });
});
