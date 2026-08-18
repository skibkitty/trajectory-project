import type { Task } from "../task.js";
import type { DependencyGraph } from "../graph/dependency-graph.js";
import type { ScheduleResult } from "../scheduling/schedule.js";

export interface EvaluationFactor {
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
}

export interface ScoringWeights {
  readonly value: number;
  readonly urgency: number;
  readonly dependency: number;
  readonly criticalPath: number;
  readonly confidence: number;
  readonly effort: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  value: 1,
  urgency: 1,
  dependency: 1,
  criticalPath: 1,
  confidence: 1,
  effort: 1,
};

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

function computeCriticalPathSet(schedule: ScheduleResult): Set<string> {
  return new Set(schedule.criticalPath);
}

function buildEvaluationFactor(
  label: string,
  contribution: number,
  direction: "positive" | "negative",
  sourceMetric: string,
  explanation: string,
): EvaluationFactor {
  return { label, contribution, direction, sourceMetric, explanation };
}

function evaluateCandidate(
  task: Task,
  weights: ScoringWeights,
  maxValue: number,
  maxUrgency: number,
  maxDependents: number,
  maxEffort: number,
  dependentCount: number,
  isOnCriticalPath: boolean,
): TaskEvaluation {
  const valueNorm = maxValue > 0 ? task.value / maxValue : 0;
  const urgencyNorm = maxUrgency > 0 ? task.urgency / maxUrgency : 0;
  const depNorm = maxDependents > 0 ? dependentCount / maxDependents : 0;
  const criticalNorm = isOnCriticalPath ? 1 : 0;
  const confidenceNorm = task.confidence;
  const effortNorm = maxEffort > 0 ? task.estimatedEffort / maxEffort : 0;

  const valueContribution = weights.value * valueNorm;
  const urgencyContribution = weights.urgency * urgencyNorm;
  const depContribution = weights.dependency * depNorm;
  const criticalContribution = weights.criticalPath * criticalNorm;
  const confidenceContribution = weights.confidence * confidenceNorm;
  const effortPenalty = weights.effort * effortNorm;

  const score =
    valueContribution +
    urgencyContribution +
    depContribution +
    criticalContribution +
    confidenceContribution -
    effortPenalty;

  const factors: EvaluationFactor[] = [
    buildEvaluationFactor(
      "Value",
      valueContribution,
      "positive",
      `value: ${task.value}`,
      `Task value is ${task.value}${maxValue > 0 ? ` (${(valueNorm * 100).toFixed(0)}% of max)` : ""}`,
    ),
    buildEvaluationFactor(
      "Urgency",
      urgencyContribution,
      "positive",
      `urgency: ${task.urgency}`,
      `Task urgency is ${task.urgency}${maxUrgency > 0 ? ` (${(urgencyNorm * 100).toFixed(0)}% of max)` : ""}`,
    ),
    buildEvaluationFactor(
      "Dependency impact",
      depContribution,
      "positive",
      `dependents: ${dependentCount}`,
      `Task has ${dependentCount} direct dependents${maxDependents > 0 ? ` (${(depNorm * 100).toFixed(0)}% of max)` : ""}`,
    ),
    buildEvaluationFactor(
      "Critical path",
      criticalContribution,
      "positive",
      `on critical path: ${isOnCriticalPath}`,
      isOnCriticalPath
        ? "Task is on the critical path"
        : "Task is not on the critical path",
    ),
    buildEvaluationFactor(
      "Confidence",
      confidenceContribution,
      "positive",
      `confidence: ${task.confidence}`,
      `Task confidence is ${(task.confidence * 100).toFixed(0)}%`,
    ),
    buildEvaluationFactor(
      "Effort penalty",
      -effortPenalty,
      "negative",
      `effort: ${task.estimatedEffort}`,
      `Task effort is ${task.estimatedEffort}${maxEffort > 0 ? ` (${(effortNorm * 100).toFixed(0)}% of max)` : ""}`,
    ),
  ];

  return {
    taskId: task.id,
    score: Math.round(score * 1000) / 1000,
    factors: Object.freeze(factors),
  };
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
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): EvaluationResult {
  const taskMap = buildTaskMap(tasks);
  const dependentCounts = computeDependentCounts(tasks, graph);
  const criticalPathSet = computeCriticalPathSet(schedule);

  const values = tasks.map((t) => t.value);
  const urgencies = tasks.map((t) => t.urgency);
  const efforts = tasks.map((t) => t.estimatedEffort);
  const allDependentCounts = [...dependentCounts.values()];

  const maxValue = Math.max(...values, 0);
  const maxUrgency = Math.max(...urgencies, 0);
  const maxEffort = Math.max(...efforts, 0);
  const maxDependents = Math.max(...allDependentCounts, 0);

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

    const evaluation = evaluateCandidate(
      task,
      weights,
      maxValue,
      maxUrgency,
      maxDependents,
      maxEffort,
      dependentCounts.get(task.id) ?? 0,
      criticalPathSet.has(task.id),
    );

    candidates.push(evaluation);
  }

  candidates.sort(sortByScore);

  const selectedTaskId = candidates.length > 0 ? candidates[0].taskId : null;

  return Object.freeze({
    candidates: Object.freeze(candidates),
    selectedTaskId,
  });
}
