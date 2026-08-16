export const TaskStatus = {
  BACKLOG: "BACKLOG",
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  DONE: "DONE",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const ALL_TASK_STATUSES: readonly TaskStatus[] = Object.values(
  TaskStatus,
) as TaskStatus[];
