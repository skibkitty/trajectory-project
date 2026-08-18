import type { Task } from "../task.js";
import type { DependencyGraph } from "../graph/dependency-graph.js";

export interface TaskSchedule {
  readonly taskId: string;
  readonly duration: number;
  readonly earliestStart: number;
  readonly earliestFinish: number;
  readonly latestStart: number;
  readonly latestFinish: number;
  readonly slack: number;
  readonly isCritical: boolean;
}

export interface ScheduleResult {
  readonly projectDuration: number;
  readonly taskSchedules: readonly TaskSchedule[];
  readonly criticalPath: readonly string[];
}

function buildTaskMap(tasks: readonly Task[]): Map<string, Task> {
  const map = new Map<string, Task>();
  for (const task of tasks) {
    map.set(task.id, task);
  }
  return map;
}

export function calculateSchedule(
  tasks: readonly Task[],
  graph: DependencyGraph,
): ScheduleResult {
  const taskMap = buildTaskMap(tasks);
  const order = graph.topologicalOrder();

  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();

  for (const taskId of order) {
    const task = taskMap.get(taskId);
    if (task === undefined) {
      throw new Error(`Schedule received unknown task "${taskId}"`);
    }
    const duration = task.estimatedEffort;
    const prerequisites = graph.getPrerequisites(taskId);
    const es =
      prerequisites.length === 0
        ? 0
        : Math.max(...prerequisites.map((p) => earliestFinish.get(p)!));
    const ef = es + duration;
    earliestStart.set(taskId, es);
    earliestFinish.set(taskId, ef);
  }

  const projectDuration =
    order.length === 0
      ? 0
      : Math.max(...order.map((id) => earliestFinish.get(id)!));

  const latestFinish = new Map<string, number>();
  const latestStart = new Map<string, number>();

  const reversed = [...order].reverse();
  for (const taskId of reversed) {
    const task = taskMap.get(taskId)!;
    const duration = task.estimatedEffort;
    const dependents = graph.getDependents(taskId);
    const lf =
      dependents.length === 0
        ? projectDuration
        : Math.min(...dependents.map((d) => latestStart.get(d)!));
    const ls = lf - duration;
    latestFinish.set(taskId, lf);
    latestStart.set(taskId, ls);
  }

  const taskSchedules: TaskSchedule[] = order.map((taskId) => {
    const es = earliestStart.get(taskId)!;
    const ef = earliestFinish.get(taskId)!;
    const ls = latestStart.get(taskId)!;
    const lf = latestFinish.get(taskId)!;
    const slack = ls - es;
    return {
      taskId,
      duration: taskMap.get(taskId)!.estimatedEffort,
      earliestStart: es,
      earliestFinish: ef,
      latestStart: ls,
      latestFinish: lf,
      slack,
      isCritical: slack === 0,
    };
  });

  const criticalPath = Object.freeze(
    taskSchedules.filter((s) => s.isCritical).map((s) => s.taskId),
  );

  return {
    projectDuration,
    taskSchedules: Object.freeze(taskSchedules),
    criticalPath,
  };
}
