import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectForm } from "./ProjectForm.js";

describe("ProjectForm", () => {
  it("renders the form fields", () => {
    render(<ProjectForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("project-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("project-description-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-project-button")).toBeInTheDocument();
  });

  it("calls onSubmit with name and description", () => {
    const onSubmit = vi.fn();
    render(<ProjectForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("project-name-input"), {
      target: { value: "My Project" },
    });
    fireEvent.change(screen.getByTestId("project-description-input"), {
      target: { value: "A description" },
    });
    fireEvent.click(screen.getByTestId("create-project-button"));

    expect(onSubmit).toHaveBeenCalledWith("My Project", "A description");
  });

  it("does not call onSubmit when name is empty", () => {
    const onSubmit = vi.fn();
    render(<ProjectForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("create-project-button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears fields after submission", () => {
    render(<ProjectForm onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByTestId("project-name-input"), {
      target: { value: "My Project" },
    });
    fireEvent.click(screen.getByTestId("create-project-button"));

    expect(screen.getByTestId("project-name-input")).toHaveValue("");
  });
});
