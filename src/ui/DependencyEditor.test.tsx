import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DependencyEditor } from "./DependencyEditor.js";
import { createTask } from "../domain/index.js";

describe("DependencyEditor", () => {
  it("renders the editor with current dependencies", () => {
    const tasks = [
      createTask({ id: "t1", title: "Task A" }),
      createTask({ id: "t2", title: "Task B", dependencies: ["t1"] }),
    ];
    render(
      <DependencyEditor
        tasks={tasks}
        onAddDependency={vi.fn()}
        onRemoveDependency={vi.fn()}
      />,
    );
    expect(screen.getByTestId("dependency-editor")).toBeInTheDocument();
    expect(screen.getByTestId("dependency-list")).toBeInTheDocument();
    expect(screen.getByTestId("dependency-item")).toBeInTheDocument();
    expect(
      screen.getByText(/t1 \(Task A\) → t2 \(Task B\)/),
    ).toBeInTheDocument();
  });

  it("calls onAddDependency when valid selection is made", () => {
    const tasks = [
      createTask({ id: "t1", title: "Task A" }),
      createTask({ id: "t2", title: "Task B" }),
    ];
    const onAdd = vi.fn();
    render(
      <DependencyEditor
        tasks={tasks}
        onAddDependency={onAdd}
        onRemoveDependency={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("dep-task-select"), {
      target: { value: "t2" },
    });
    fireEvent.change(screen.getByTestId("dep-prerequisite-select"), {
      target: { value: "t1" },
    });
    fireEvent.click(screen.getByTestId("add-dependency-button"));

    expect(onAdd).toHaveBeenCalledWith("t2", "t1");
  });

  it("shows error when selecting same task as prerequisite", () => {
    const tasks = [
      createTask({ id: "t1", title: "Task A" }),
      createTask({ id: "t2", title: "Task B" }),
    ];
    render(
      <DependencyEditor
        tasks={tasks}
        onAddDependency={vi.fn()}
        onRemoveDependency={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("dep-task-select"), {
      target: { value: "t1" },
    });
    fireEvent.change(screen.getByTestId("dep-prerequisite-select"), {
      target: { value: "t1" },
    });
    fireEvent.click(screen.getByTestId("add-dependency-button"));

    expect(screen.getByTestId("dep-error")).toBeInTheDocument();
  });

  it("calls onRemoveDependency when remove is clicked", () => {
    const tasks = [
      createTask({ id: "t1", title: "Task A" }),
      createTask({ id: "t2", title: "Task B", dependencies: ["t1"] }),
    ];
    const onRemove = vi.fn();
    render(
      <DependencyEditor
        tasks={tasks}
        onAddDependency={vi.fn()}
        onRemoveDependency={onRemove}
      />,
    );

    fireEvent.click(screen.getByTestId("remove-dependency-t2-t1"));
    expect(onRemove).toHaveBeenCalledWith("t2", "t1");
  });
});
