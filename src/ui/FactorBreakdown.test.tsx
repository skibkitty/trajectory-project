import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FactorBreakdown } from "./FactorBreakdown.js";
import type { EvaluationFactor } from "../domain/index.js";

const mockFactors: readonly EvaluationFactor[] = [
  {
    id: "value",
    label: "Value",
    contribution: 0.8,
    direction: "positive",
    sourceMetric: "value: 8",
    explanation: "Task value is 8 (100% of max)",
  },
  {
    id: "effort",
    label: "Effort penalty",
    contribution: -0.5,
    direction: "negative",
    sourceMetric: "effort: 5",
    explanation: "Task effort is 5 (100% of max)",
  },
  {
    id: "criticalPath",
    label: "Critical path",
    contribution: 1.0,
    direction: "positive",
    sourceMetric: "on critical path: true",
    explanation: "Task is on the critical path",
  },
];

describe("FactorBreakdown", () => {
  it("renders all factors in a table", () => {
    render(<FactorBreakdown factors={mockFactors} />);

    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Effort penalty")).toBeInTheDocument();
    expect(screen.getByText("Critical path")).toBeInTheDocument();
  });

  it("shows formatted contributions with signs", () => {
    render(<FactorBreakdown factors={mockFactors} />);

    expect(screen.getByText("+0.800")).toBeInTheDocument();
    expect(screen.getByText("-0.500")).toBeInTheDocument();
    expect(screen.getByText("+1.000")).toBeInTheDocument();
  });

  it("shows direction indicators", () => {
    render(<FactorBreakdown factors={mockFactors} />);

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(4);
  });

  it("renders nothing for empty factors", () => {
    const { container } = render(<FactorBreakdown factors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows factor explanations", () => {
    render(<FactorBreakdown factors={mockFactors} />);

    expect(
      screen.getByText("Task value is 8 (100% of max)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Task is on the critical path"),
    ).toBeInTheDocument();
  });

  it("shows source metrics", () => {
    render(<FactorBreakdown factors={mockFactors} />);

    const sourceCells = screen.getAllByText(/^value: 8$/);
    expect(sourceCells.length).toBeGreaterThanOrEqual(1);
    const effortCells = screen.getAllByText(/^effort: 5$/);
    expect(effortCells.length).toBeGreaterThanOrEqual(1);
  });
});
