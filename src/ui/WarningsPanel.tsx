import type { RecommendationWarning } from "../domain/index.js";

export interface WarningsPanelProps {
  warnings: readonly RecommendationWarning[];
}

export function WarningsPanel({ warnings }: WarningsPanelProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="warnings-panel" data-testid="warnings-panel">
      <h3>Warnings</h3>
      <ul className="warnings-list">
        {warnings.map((warning) => (
          <li key={warning.id} className="warning-item">
            <span className="warning-message">{warning.message}</span>
            {warning.affectedTaskIds && warning.affectedTaskIds.length > 0 && (
              <span className="warning-affected">
                Affected: {warning.affectedTaskIds.join(", ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
