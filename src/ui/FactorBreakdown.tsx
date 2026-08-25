import type { EvaluationFactor } from "../domain/index.js";

export interface FactorBreakdownProps {
  factors: readonly EvaluationFactor[];
}

function formatContribution(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

function formatDirection(direction: "positive" | "negative"): string {
  return direction === "positive" ? "↑" : "↓";
}

export function FactorBreakdown({ factors }: FactorBreakdownProps) {
  if (factors.length === 0) {
    return null;
  }

  return (
    <div className="factor-breakdown" data-testid="factor-breakdown">
      <h3>Scoring Factors</h3>
      <table className="factor-table">
        <thead>
          <tr>
            <th>Factor</th>
            <th>Direction</th>
            <th>Contribution</th>
            <th>Source</th>
            <th>Explanation</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((factor) => (
            <tr key={factor.id} data-testid={`factor-${factor.id}`}>
              <td>{factor.label}</td>
              <td>{formatDirection(factor.direction)}</td>
              <td>{formatContribution(factor.contribution)}</td>
              <td>{factor.sourceMetric}</td>
              <td>{factor.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
