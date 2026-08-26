import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskForm } from "./TaskForm.js";

describe("TaskForm", () => {
  it("renders the form fields", () => {
    render(<TaskForm existingTaskIds={[]} onSubmit={vi.fn()} />);
    expect(screen.getByTestId("task-id-input")).toBeInTheDocument();
    expect(screen.getByTestId("task-title-input")).toBeInTheDocument();
    expect(screen.getByTestId("task-value-input")).toBeInTheDocument();
    expect(screen.getByTestId("task-urgency-input")).toBeInTheDocument();
    expect(screen.getByTestId("task-effort-input")).toBeInTheDocument();
    expect(screen.getByTestId("task-confidence-input")).toBeInTheDocument();
    expect(screen.getByTestId("task-status-input")).toBeInTheDocument();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("calls onSubmit with form data", () => {
    const onSubmit = vi.fn();
    render(<TaskForm existingTaskIds={[]} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("task-id-input"), {
      target: { value: "t1" },
    });
    fireEvent.change(screen.getByTestId("task-title-input"), {
      target: { value: "My Task" },
    });
    fireEvent.click(screen.getByTestId("add-task-button"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1", title: "My Task" }),
    );
  });

  it("shows error for duplicate task ID", () => {
    render(<TaskForm existingTaskIds={["t1"]} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByTestId("task-id-input"), {
      target: { value: "t1" },
    });
    fireEvent.change(screen.getByTestId("task-title-input"), {
      target: { value: "Duplicate" },
    });
    fireEvent.click(screen.getByTestId("add-task-button"));

    expect(screen.getByTestId("task-form-error")).toBeInTheDocument();
  });

  it("shows error for empty ID", () => {
    render(<TaskForm existingTaskIds={[]} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByTestId("task-title-input"), {
      target: { value: "No ID" },
    });
    fireEvent.submit(screen.getByTestId("task-form"));

    expect(screen.getByTestId("task-form-error")).toBeInTheDocument();
  });
});
