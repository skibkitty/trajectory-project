import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WarningsPanel } from "./WarningsPanel.js";
import type { RecommendationWarning } from "../domain/index.js";

const mockWarnings: readonly RecommendationWarning[] = [
  {
    id: "tie-break-applied",
    message:
      "2 candidates tie at score 1.500; the recommendation was chosen by the documented tie-breaking policy (ascending task id).",
    affectedTaskIds: ["task-a", "task-b"],
  },
  {
    id: "zero-maximum-normalization",
    message:
      "All tasks share the same value, so normalization for those metrics contributes nothing to scores.",
  },
];

describe("WarningsPanel", () => {
  it("renders all warnings", () => {
    render(<WarningsPanel warnings={mockWarnings} />);

    expect(screen.getByText(/tie at score/)).toBeInTheDocument();
    expect(
      screen.getByText(/All tasks share the same value/),
    ).toBeInTheDocument();
  });

  it("shows affected task IDs when present", () => {
    render(<WarningsPanel warnings={mockWarnings} />);

    expect(screen.getByText("Affected: task-a, task-b")).toBeInTheDocument();
  });

  it("renders nothing for empty warnings", () => {
    const { container } = render(<WarningsPanel warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("hides affected tasks section when list is empty", () => {
    const warnings: readonly RecommendationWarning[] = [
      {
        id: "no-eligible-tasks",
        message: "There are currently no eligible tasks to recommend.",
        affectedTaskIds: [],
      },
    ];
    render(<WarningsPanel warnings={warnings} />);
    expect(screen.queryByText("Affected:")).not.toBeInTheDocument();
  });
});
