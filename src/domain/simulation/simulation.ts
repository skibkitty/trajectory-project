import { createTask } from "../task.js";
import type { Task, CreateTaskInput } from "../task.js";
import { createDependencyGraph } from "../graph/dependency-graph.js";
import type { DependencyGraph } from "../graph/dependency-graph.js";
import { calculateSchedule } from "../scheduling/schedule.js";
import type { ScheduleResult } from "../scheduling/schedule.js";
import { DEFAULT_FACTORS } from "../decision/engine.js";
import type { ScoringFactor } from "../decision/engine.js";
import { recommendNextTask } from "../decision/recommendation.js";

export interface DelayTaskScenario {
  readonly kind: "delay-task";
  readonly taskId: string;
  readonly additionalEffort: number;
}

export interface ChangeEffortScenario {
  readonly kind: "change-effort";
  readonly taskId: string;
  readonly newEffort: number;
}

export interface RemoveTaskScenario {
  readonly kind: "remove-task";
  readonly taskId: string;
}

export type Scenario =
  DelayTaskScenario | ChangeEffortScenario | RemoveTaskScenario;

export interface SimulationSide {
  readonly projectDuration: number;
  readonly criticalPath: readonly string[];
  readonly recommendedTaskId: string | null;
  readonly recommendedScore: number | null;
}

export interface SimulationResult {
  readonly scenario: Scenario;
  readonly scenarioTasks: readonly Task[];
  readonly baseline: SimulationSide;
  readonly projected: SimulationSide;
  readonly durationDelta: number;
  readonly criticalPathChanged: boolean;
  readonly recommendationChanged: boolean;
  readonly affectedDownstreamTaskIds: readonly string[];
  readonly valueRemoved: number | null;
}

function requireTarget(tasks: readonly Task[], taskId: string): Task {
  const target = tasks.find((t) => t.id === taskId);
  if (!target) {
    throw new Error(`Scenario targets unknown task "${taskId}"`);
  }
  return target;
}

function rebuildTask(task: Task, overrides: Partial<CreateTaskInput>): Task {
  return createTask({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    value: task.value,
    urgency: task.urgency,
    estimatedEffort: task.estimatedEffort,
    confidence: task.confidence,
    goalId: task.goalId ?? undefined,
    dependencies: [...task.dependencies],
    ...overrides,
  });
}

export function applyScenario(
  tasks: readonly Task[],
  scenario: Scenario,
): Task[] {
  switch (scenario.kind) {
    case "delay-task": {
      if (!(scenario.additionalEffort > 0)) {
        throw new Error("Delay requires a positive additionalEffort");
      }
      requireTarget(tasks, scenario.taskId);
      return tasks.map((task) =>
        task.id === scenario.taskId
          ? rebuildTask(task, {
              estimatedEffort: task.estimatedEffort + scenario.additionalEffort,
            })
          : task,
      );
    }
    case "change-effort": {
      if (!(scenario.newEffort > 0)) {
        throw new Error("Effort change requires a positive newEffort");
      }
      requireTarget(tasks, scenario.taskId);
      return tasks.map((task) =>
        task.id === scenario.taskId
          ? rebuildTask(task, { estimatedEffort: scenario.newEffort })
          : task,
      );
    }
    case "remove-task": {
      requireTarget(tasks, scenario.taskId);
      return tasks
        .filter((task) => task.id !== scenario.taskId)
        .map((task) =>
          task.dependencies.includes(scenario.taskId)
            ? rebuildTask(task, {
                dependencies: task.dependencies.filter(
                  (d) => d !== scenario.taskId,
                ),
              })
            : task,
        );
    }
  }
}

function buildSide(
  tasks: readonly Task[],
  graph: DependencyGraph,
  schedule: ScheduleResult,
  factors: readonly ScoringFactor[],
): SimulationSide {
  const recommendation = recommendNextTask(tasks, graph, schedule, factors);
  return Object.freeze({
    projectDuration: schedule.projectDuration,
    criticalPath: Object.freeze([...schedule.criticalPath]),
    recommendedTaskId: recommendation.taskId,
    recommendedScore: recommendation.score,
  });
}

type ScheduleWindow = Pick<
  ScheduleResult["taskSchedules"][number],
  "earliestStart" | "earliestFinish"
>;

function scheduleWindows(
  schedule: ScheduleResult,
): Map<string, ScheduleWindow> {
  const windows = new Map<string, ScheduleWindow>();
  for (const entry of schedule.taskSchedules) {
    windows.set(entry.taskId, {
      earliestStart: entry.earliestStart,
      earliestFinish: entry.earliestFinish,
    });
  }
  return windows;
}

export function simulateScenario(
  baselineTasks: readonly Task[],
  scenario: Scenario,
  factors: readonly ScoringFactor[] = DEFAULT_FACTORS,
): SimulationResult {
  const baselineGraph = createDependencyGraph(baselineTasks);
  const baselineSchedule = calculateSchedule(baselineTasks, baselineGraph);

  requireTarget(baselineTasks, scenario.taskId);
  const downstream = [
    scenario.taskId,
    ...baselineGraph.getAllDependents(scenario.taskId),
  ];

  const scenarioTasks = applyScenario(baselineTasks, scenario);
  const scenarioGraph = createDependencyGraph(scenarioTasks);
  const scenarioSchedule = calculateSchedule(scenarioTasks, scenarioGraph);

  const baseline = buildSide(
    baselineTasks,
    baselineGraph,
    baselineSchedule,
    factors,
  );
  const projected = buildSide(
    scenarioTasks,
    scenarioGraph,
    scenarioSchedule,
    factors,
  );

  const surviving = new Set(scenarioGraph.taskIds);
  const baselineWindows = scheduleWindows(baselineSchedule);
  const projectedWindows = scheduleWindows(scenarioSchedule);
  const affectedDownstreamTaskIds = downstream
    .filter((taskId) => {
      if (!surviving.has(taskId)) {
        return false;
      }
      const before = baselineWindows.get(taskId);
      const after = projectedWindows.get(taskId);
      if (!before || !after) {
        return false;
      }
      return (
        before.earliestStart !== after.earliestStart ||
        before.earliestFinish !== after.earliestFinish
      );
    })
    .sort((a, b) => a.localeCompare(b));

  const round = (n: number) => Math.round(n * 1000) / 1000;
  const orderedScenarioTasks = [...scenarioTasks].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  return Object.freeze({
    scenario,
    scenarioTasks: Object.freeze(orderedScenarioTasks),
    baseline,
    projected,
    durationDelta: round(projected.projectDuration - baseline.projectDuration),
    criticalPathChanged:
      baseline.criticalPath.join("\u0000") !==
      projected.criticalPath.join("\u0000"),
    recommendationChanged:
      baseline.recommendedTaskId !== projected.recommendedTaskId,
    affectedDownstreamTaskIds: Object.freeze(affectedDownstreamTaskIds),
    valueRemoved:
      scenario.kind === "remove-task"
        ? requireTarget(baselineTasks, scenario.taskId).value
        : null,
  });
}
