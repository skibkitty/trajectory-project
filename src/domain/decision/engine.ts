import type { Task } from "../task.js";
import type { DependencyGraph } from "../graph/dependency-graph.js";
import type { ScheduleResult } from "../scheduling/schedule.js";

export interface EvaluationFactor {
  readonly id: string;
  readonly label: string;
  readonly contribution: number;
  readonly direction: "positive" | "negative";
  readonly sourceMetric: string;
  readonly explanation: string;
}

export interface TaskEvaluation {
  readonly taskId: string;
  readonly score: number;
  readonly factors: readonly EvaluationFactor[];
}

export interface EvaluationResult {
  readonly candidates: readonly TaskEvaluation[];
  readonly selectedTaskId: string | null;
  readonly maxValues: NormalizationMaxima;
}

export interface NormalizationMaxima {
  readonly value: number;
  readonly urgency: number;
  readonly effort: number;
  readonly dependents: number;
}

export interface ScoringContext {
  readonly task: Task;
  readonly taskMap: ReadonlyMap<string, Task>;
  readonly graph: DependencyGraph;
  readonly schedule: ScheduleResult;
  readonly dependentCounts: ReadonlyMap<string, number>;
  readonly criticalPathSet: ReadonlySet<string>;
  readonly maxValues: NormalizationMaxima;
}

export interface FactorComputation {
  readonly normalized: number;
  readonly sourceMetric: string;
  readonly explanation: string;
}

export interface ScoringFactor {
  readonly id: string;
  readonly label: string;
  readonly direction: "positive" | "negative";
  readonly weight: number;
  compute(context: ScoringContext): FactorComputation;
}

const valueFactor: ScoringFactor = {
  id: "value",
  label: "Value",
  direction: "positive",
  weight: 1,
  compute(ctx) {
    const norm =
      ctx.maxValues.value > 0 ? ctx.task.value / ctx.maxValues.value : 0;
    return {
      normalized: norm,
      sourceMetric: `value: ${ctx.task.value}`,
      explanation: `Task value is ${ctx.task.value}${ctx.maxValues.value > 0 ? ` (${(norm * 100).toFixed(0)}% of max)` : ""}`,
    };
  },
};

const urgencyFactor: ScoringFactor = {
  id: "urgency",
  label: "Urgency",
  direction: "positive",
  weight: 1,
  compute(ctx) {
    const norm =
      ctx.maxValues.urgency > 0 ? ctx.task.urgency / ctx.maxValues.urgency : 0;
    return {
      normalized: norm,
      sourceMetric: `urgency: ${ctx.task.urgency}`,
      explanation: `Task urgency is ${ctx.task.urgency}${ctx.maxValues.urgency > 0 ? ` (${(norm * 100).toFixed(0)}% of max)` : ""}`,
    };
  },
};

const dependencyImpactFactor: ScoringFactor = {
  id: "dependency",
  label: "Dependency impact",
  direction: "positive",
  weight: 1,
  compute(ctx) {
    const count = ctx.dependentCounts.get(ctx.task.id) ?? 0;
    const norm =
      ctx.maxValues.dependents > 0 ? count / ctx.maxValues.dependents : 0;
    return {
      normalized: norm,
      sourceMetric: `dependents: ${count}`,
      explanation: `Task has ${count} direct dependents${ctx.maxValues.dependents > 0 ? ` (${(norm * 100).toFixed(0)}% of max)` : ""}`,
    };
  },
};

const criticalPathFactor: ScoringFactor = {
  id: "criticalPath",
  label: "Critical path",
  direction: "positive",
  weight: 1,
  compute(ctx) {
    const isCritical = ctx.criticalPathSet.has(ctx.task.id);
    return {
      normalized: isCritical ? 1 : 0,
      sourceMetric: `on critical path: ${isCritical}`,
      explanation: isCritical
        ? "Task is on the critical path"
        : "Task is not on the critical path",
    };
  },
};

const confidenceFactor: ScoringFactor = {
  id: "confidence",
  label: "Confidence",
  direction: "positive",
  weight: 1,
  compute(ctx) {
    return {
      normalized: ctx.task.confidence,
      sourceMetric: `confidence: ${ctx.task.confidence}`,
      explanation: `Task confidence is ${(ctx.task.confidence * 100).toFixed(0)}%`,
    };
  },
};

const effortPenaltyFactor: ScoringFactor = {
  id: "effort",
  label: "Effort penalty",
  direction: "negative",
  weight: 1,
  compute(ctx) {
    const norm =
      ctx.maxValues.effort > 0
        ? ctx.task.estimatedEffort / ctx.maxValues.effort
        : 0;
    return {
      normalized: norm,
      sourceMetric: `effort: ${ctx.task.estimatedEffort}`,
      explanation: `Task effort is ${ctx.task.estimatedEffort}${ctx.maxValues.effort > 0 ? ` (${(norm * 100).toFixed(0)}% of max)` : ""}`,
    };
  },
};

export const DEFAULT_FACTORS: readonly ScoringFactor[] = Object.freeze([
  valueFactor,
  urgencyFactor,
  dependencyImpactFactor,
  criticalPathFactor,
  confidenceFactor,
  effortPenaltyFactor,
]);

function buildTaskMap(tasks: readonly Task[]): Map<string, Task> {
  const map = new Map<string, Task>();
  for (const task of tasks) {
    map.set(task.id, task);
  }
  return map;
}

function computeDependentCounts(
  tasks: readonly Task[],
  graph: DependencyGraph,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    counts.set(task.id, graph.getDependents(task.id).length);
  }
  return counts;
}

function evaluateCandidate(
  task: Task,
  factors: readonly ScoringFactor[],
  context: ScoringContext,
): TaskEvaluation {
  let score = 0;
  const evaluationFactors: EvaluationFactor[] = [];

  for (const factor of factors) {
    const result = factor.compute(context);
    const contribution = factor.weight * result.normalized;
    const signed =
      factor.direction === "negative" ? -contribution : contribution;
    score += signed;
    evaluationFactors.push(
      Object.freeze({
        id: factor.id,
        label: factor.label,
        contribution: signed,
        direction: factor.direction,
        sourceMetric: result.sourceMetric,
        explanation: result.explanation,
      }),
    );
  }

  return Object.freeze({
    taskId: task.id,
    score: Math.round(score * 1000) / 1000,
    factors: Object.freeze(evaluationFactors),
  });
}

function sortByScore(a: TaskEvaluation, b: TaskEvaluation): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  return a.taskId.localeCompare(b.taskId);
}

export function evaluateTasks(
  tasks: readonly Task[],
  graph: DependencyGraph,
  schedule: ScheduleResult,
  factors: readonly ScoringFactor[] = DEFAULT_FACTORS,
): EvaluationResult {
  const taskMap = buildTaskMap(tasks);
  const dependentCounts = computeDependentCounts(tasks, graph);
  const criticalPathSet = new Set(schedule.criticalPath);

  const values = tasks.map((t) => t.value);
  const urgencies = tasks.map((t) => t.urgency);
  const efforts = tasks.map((t) => t.estimatedEffort);
  const allDependentCounts = [...dependentCounts.values()];

  const maxValues = Object.freeze({
    value: Math.max(...values, 0),
    urgency: Math.max(...urgencies, 0),
    effort: Math.max(...efforts, 0),
    dependents: Math.max(...allDependentCounts, 0),
  });

  const baseContext = Object.freeze({
    taskMap,
    graph,
    schedule,
    dependentCounts,
    criticalPathSet,
    maxValues,
  });

  const candidates: TaskEvaluation[] = [];

  for (const task of tasks) {
    if (task.status === "DONE") {
      continue;
    }

    const prerequisites = graph.getPrerequisites(task.id);
    const allPrereqsDone = prerequisites.every((prereqId) => {
      const prereq = taskMap.get(prereqId);
      return prereq !== undefined && prereq.status === "DONE";
    });

    if (!allPrereqsDone) {
      continue;
    }

    const context: ScoringContext = { ...baseContext, task };
    const evaluation = evaluateCandidate(task, factors, context);
    candidates.push(evaluation);
  }

  candidates.sort(sortByScore);

  const selectedTaskId = candidates.length > 0 ? candidates[0].taskId : null;

  return Object.freeze({
    candidates: Object.freeze(candidates),
    selectedTaskId,
    maxValues,
  });
}
