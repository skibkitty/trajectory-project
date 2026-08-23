import type { Task } from "../task.js";
import type { DependencyGraph } from "../graph/dependency-graph.js";
import type { ScheduleResult } from "../scheduling/schedule.js";
import { evaluateTasks, DEFAULT_FACTORS } from "./engine.js";
import type {
  EvaluationFactor,
  NormalizationMaxima,
  ScoringFactor,
} from "./engine.js";

export interface Assumption {
  readonly id: string;
  readonly statement: string;
  readonly detail?: string;
}

export interface RecommendationWarning {
  readonly id: string;
  readonly message: string;
  readonly affectedTaskIds?: readonly string[];
}

export interface Recommendation {
  readonly taskId: string | null;
  readonly score: number | null;
  readonly factors: readonly EvaluationFactor[];
  readonly assumptions: readonly Assumption[];
  readonly warnings: readonly RecommendationWarning[];
}

function buildAssumptions(maxValues: NormalizationMaxima): Assumption[] {
  return [
    {
      id: "additive-model",
      statement:
        "The score is an additive sum of weighted, normalized factor contributions.",
    },
    {
      id: "normalization-maxima",
      statement:
        "Under the default factor set, value, urgency, effort, and dependent counts are divided by the maximum of that metric across the evaluated task set.",
      detail: `max value ${maxValues.value}, max urgency ${maxValues.urgency}, max effort ${maxValues.effort}, max dependents ${maxValues.dependents}`,
    },
    {
      id: "confidence-bounded",
      statement:
        "Confidence is already bounded [0, 1] and contributes directly without renormalization.",
    },
    {
      id: "critical-path-source",
      statement:
        "Critical-path membership comes from the CPM schedule; a task with zero slack counts as critical.",
    },
    {
      id: "tie-break-policy",
      statement:
        "Score ties are broken by ascending task id (lexicographic), so ranking never depends on input order.",
    },
    {
      id: "provisional-weights",
      statement:
        "Default factor weights are provisional and must not be treated as objectively correct.",
    },
  ];
}

const ZERO_MAX_METRICS: ReadonlyArray<{
  key: keyof NormalizationMaxima;
  label: string;
}> = Object.freeze([
  { key: "value", label: "value" },
  { key: "urgency", label: "urgency" },
  { key: "effort", label: "effort" },
  { key: "dependents", label: "dependent count" },
]);

function buildWarnings(
  candidates: readonly { taskId: string; score: number }[],
  taskMap: ReadonlyMap<string, Task>,
  maxValues: NormalizationMaxima,
): RecommendationWarning[] {
  const warnings: RecommendationWarning[] = [];

  const top = candidates[0];
  if (!top) {
    warnings.push({
      id: "no-eligible-tasks",
      message: "There are currently no eligible tasks to recommend.",
    });
    return warnings;
  }

  const tied = candidates
    .filter((c) => c.score === top.score)
    .map((c) => c.taskId)
    .sort((a, b) => a.localeCompare(b));
  if (tied.length > 1) {
    warnings.push({
      id: "tie-break-applied",
      message: `${tied.length} candidates tie at score ${top.score}; the recommendation was chosen by the documented tie-breaking policy (ascending task id).`,
      affectedTaskIds: tied,
    });
  }

  const zeroMetrics = ZERO_MAX_METRICS.filter(
    ({ key }) => maxValues[key] === 0,
  ).map(({ label }) => label);
  if (zeroMetrics.length > 0) {
    warnings.push({
      id: "zero-maximum-normalization",
      message: `All tasks share the same ${zeroMetrics.join(" and ")}, so normalization for those metrics contributes nothing to scores.`,
    });
  }

  const blockedEligible = candidates
    .filter((c) => taskMap.get(c.taskId)?.status === "BLOCKED")
    .map((c) => c.taskId)
    .sort((a, b) => a.localeCompare(b));
  if (blockedEligible.length > 0) {
    warnings.push({
      id: "blocked-status-eligible",
      message:
        "Tasks marked BLOCKED satisfy the eligibility rule (all prerequisites DONE) and therefore remain under consideration; the BLOCKED flag does not exclude tasks.",
      affectedTaskIds: blockedEligible,
    });
  }

  return warnings;
}

export function recommendNextTask(
  tasks: readonly Task[],
  graph: DependencyGraph,
  schedule: ScheduleResult,
  factors: readonly ScoringFactor[] = DEFAULT_FACTORS,
): Recommendation {
  const result = evaluateTasks(tasks, graph, schedule, factors);

  const taskMap = new Map<string, Task>();
  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  const selected = result.candidates.find(
    (c) => c.taskId === result.selectedTaskId,
  );

  const assumptions = buildAssumptions(result.maxValues);
  const warnings = buildWarnings(result.candidates, taskMap, result.maxValues);

  return Object.freeze({
    taskId: selected?.taskId ?? null,
    score: selected?.score ?? null,
    factors: selected ? selected.factors : Object.freeze([]),
    assumptions: Object.freeze(assumptions),
    warnings: Object.freeze(warnings),
  });
}
