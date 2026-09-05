import { useState } from "react";
import type { ScenarioService } from "../application/scenario-service.js";
import type { Scenario, SimulationResult, Task } from "../domain/index.js";

export interface ScenarioPanelProps {
  projectId: string;
  scenarioService: ScenarioService;
  tasks: readonly Task[];
}

type ScenarioKind = "delay-task" | "change-effort" | "remove-task";

const KIND_LABELS: Record<ScenarioKind, string> = {
  "delay-task": "Delay a task",
  "change-effort": "Change effort",
  "remove-task": "Remove a task",
};

export function ScenarioPanel({
  projectId,
  scenarioService,
  tasks,
}: ScenarioPanelProps) {
  const [kind, setKind] = useState<ScenarioKind>("delay-task");
  const [taskId, setTaskId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const titleFor = (id: string | null) => {
    if (id === null) return "none";
    const task = tasks.find((t) => t.id === id);
    return task ? `${id} (${task.title})` : id;
  };

  async function handleRun() {
    setError(null);
    if (!taskId) {
      setError("Select a task to run the scenario on");
      return;
    }

    let scenario: Scenario;
    if (kind === "delay-task") {
      const amountValue = Number(amount);
      if (!(amountValue > 0)) {
        setError("Delay amount must be a positive number");
        return;
      }
      scenario = { kind: "delay-task", taskId, additionalEffort: amountValue };
    } else if (kind === "change-effort") {
      const amountValue = Number(amount);
      if (!(amountValue > 0)) {
        setError("New effort must be a positive number");
        return;
      }
      scenario = { kind: "change-effort", taskId, newEffort: amountValue };
    } else {
      scenario = { kind: "remove-task", taskId };
    }

    setLoading(true);
    try {
      const simulation = await scenarioService.runScenario(projectId, scenario);
      setResult(simulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run scenario");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const showAmount = kind !== "remove-task";

  return (
    <section className="scenario-panel" data-testid="scenario-panel">
      <h2>Scenario</h2>
      <p className="scenario-hint">
        Run a what-if change against the current project and compare it to the
        baseline forecast.
      </p>

      <div className="scenario-controls">
        <div>
          <label htmlFor="scenario-kind">Change type</label>
          <select
            id="scenario-kind"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as ScenarioKind);
              setResult(null);
            }}
            data-testid="scenario-kind-select"
          >
            {(Object.keys(KIND_LABELS) as ScenarioKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scenario-task">Task</label>
          <select
            id="scenario-task"
            value={taskId}
            onChange={(e) => {
              setTaskId(e.target.value);
              setResult(null);
            }}
            data-testid="scenario-task-select"
          >
            <option value="">Select task...</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} — {t.title}
              </option>
            ))}
          </select>
        </div>

        {showAmount && (
          <div>
            <label htmlFor="scenario-amount">
              {kind === "delay-task"
                ? "Additional effort (days)"
                : "New effort (days)"}
            </label>
            <input
              id="scenario-amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setResult(null);
              }}
              data-testid="scenario-amount-input"
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        data-testid="run-scenario-button"
      >
        {loading ? "Running..." : "Run Scenario"}
      </button>

      {error && (
        <div className="error" role="alert" data-testid="scenario-error">
          {error}
        </div>
      )}

      {result && <ScenarioComparison result={result} titleFor={titleFor} />}
    </section>
  );
}

function ScenarioComparison({
  result,
  titleFor,
}: {
  result: SimulationResult;
  titleFor: (id: string | null) => string;
}) {
  const { baseline, projected } = result;

  return (
    <div className="scenario-comparison" data-testid="scenario-comparison">
      <h3>Baseline vs. Projected</h3>

      <table className="scenario-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Baseline</th>
            <th>Projected</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Project duration</td>
            <td>{baseline.projectDuration}</td>
            <td>{projected.projectDuration}</td>
            <td data-testid="duration-delta">
              {formatDelta(result.durationDelta)}
            </td>
          </tr>
          <tr>
            <td>Blocked tasks</td>
            <td>{baseline.blockedTaskCount}</td>
            <td>{projected.blockedTaskCount}</td>
            <td data-testid="blocked-task-delta">
              {formatDelta(result.blockedTaskDelta)}
            </td>
          </tr>
          <tr>
            <td>Newly critical tasks</td>
            <td>—</td>
            <td data-testid="newly-critical">
              {result.newlyCriticalTaskIds.length > 0
                ? result.newlyCriticalTaskIds.join(", ")
                : "none"}
            </td>
            <td>{result.newlyCriticalTaskIds.length > 0 ? "at risk" : "—"}</td>
          </tr>
          <tr>
            <td>Critical path</td>
            <td>{baseline.criticalPath.join(", ")}</td>
            <td>{projected.criticalPath.join(", ")}</td>
            <td>{result.criticalPathChanged ? "changed" : "unchanged"}</td>
          </tr>
          <tr>
            <td>Recommended task</td>
            <td>{titleFor(baseline.recommendedTaskId)}</td>
            <td>{titleFor(projected.recommendedTaskId)}</td>
            <td>{result.recommendationChanged ? "changed" : "unchanged"}</td>
          </tr>
        </tbody>
      </table>

      {(result.affectedDownstreamTaskIds.length > 0 ||
        result.valueRemoved != null) && (
        <dl className="scenario-details" data-testid="scenario-details">
          {result.affectedDownstreamTaskIds.length > 0 && (
            <>
              <dt>Affected downstream tasks</dt>
              <dd data-testid="affected-downstream">
                {result.affectedDownstreamTaskIds
                  .map((id) => titleFor(id))
                  .join(", ")}
              </dd>
            </>
          )}
          {result.valueRemoved != null && (
            <>
              <dt>Value removed</dt>
              <dd data-testid="value-removed">{result.valueRemoved}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}

function formatDelta(n: number): string {
  if (n > 0) return `+${n}`;
  return `${n}`;
}
