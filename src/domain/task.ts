import type { TaskStatus } from "./task-status.js";

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly value: number;
  readonly urgency: number;
  readonly estimatedEffort: number;
  readonly confidence: number;
  readonly goalId: string | null;
  readonly dependencies: readonly string[];
}

export interface CreateTaskInput {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly value?: number;
  readonly urgency?: number;
  readonly estimatedEffort?: number;
  readonly confidence?: number;
  readonly goalId?: string;
  readonly dependencies?: readonly string[];
}

export function createTask(input: CreateTaskInput): Task {
  if (!input.id) {
    throw new Error("Task id is required");
  }
  if (!input.title) {
    throw new Error("Task title is required");
  }
  if (input.value !== undefined && input.value < 0) {
    throw new Error("Task value must be non-negative");
  }
  if (input.urgency !== undefined && input.urgency < 0) {
    throw new Error("Task urgency must be non-negative");
  }
  if (input.estimatedEffort !== undefined && input.estimatedEffort <= 0) {
    throw new Error("Task estimated effort must be positive");
  }
  if (input.confidence !== undefined) {
    if (input.confidence < 0 || input.confidence > 1) {
      throw new Error("Task confidence must be between 0 and 1");
    }
  }
  if (input.dependencies) {
    if (input.dependencies.includes(input.id)) {
      throw new Error("Task cannot depend on itself");
    }
  }

  return {
    id: input.id,
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "BACKLOG",
    value: input.value ?? 0,
    urgency: input.urgency ?? 0,
    estimatedEffort: input.estimatedEffort ?? 1,
    confidence: input.confidence ?? 1,
    goalId: input.goalId ?? null,
    dependencies: input.dependencies ?? [],
  };
}
