import type { Project, Task, Goal, TaskStatus } from "../domain/index.js";
import {
  createProject,
  createTask,
  createGoal,
  ALL_TASK_STATUSES,
} from "../domain/index.js";

export const CURRENT_SCHEMA_VERSION = 1;

export interface GoalData {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface TaskData {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly value: number;
  readonly urgency: number;
  readonly estimatedEffort: number;
  readonly confidence: number;
  readonly goalId: string | null;
  readonly dependencies: readonly string[];
}

export interface ProjectData {
  readonly schemaVersion: number;
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tasks: readonly TaskData[];
  readonly goals: readonly GoalData[];
}

export function serialize(project: Project): ProjectData {
  return Object.freeze({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: project.id,
    name: project.name,
    description: project.description,
    tasks: Object.freeze(project.tasks.map(serializeTask)),
    goals: Object.freeze(project.goals.map(serializeGoal)),
  });
}

function serializeTask(task: Task): TaskData {
  return Object.freeze({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    value: task.value,
    urgency: task.urgency,
    estimatedEffort: task.estimatedEffort,
    confidence: task.confidence,
    goalId: task.goalId,
    // Copy so later mutation of the caller's array cannot alias into the
    // serialized output, then freeze to match the deep-freeze contract.
    dependencies: Object.freeze([...task.dependencies]),
  });
}

function serializeGoal(goal: Goal): GoalData {
  return Object.freeze({
    id: goal.id,
    name: goal.name,
    description: goal.description,
  });
}

export function deserialize(data: unknown): Project {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid project data: expected an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.schemaVersion !== "number") {
    throw new Error("Invalid project data: missing schemaVersion");
  }

  if (obj.schemaVersion < CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Invalid project data: schema version ${obj.schemaVersion} is older than current version ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Invalid project data: schema version ${obj.schemaVersion} is newer than current version ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  if (typeof obj.id !== "string" || !obj.id) {
    throw new Error("Invalid project data: missing or empty id");
  }

  if (typeof obj.name !== "string" || !obj.name) {
    throw new Error("Invalid project data: missing or empty name");
  }

  if (!Array.isArray(obj.tasks)) {
    throw new Error("Invalid project data: tasks must be an array");
  }

  if (!Array.isArray(obj.goals)) {
    throw new Error("Invalid project data: goals must be an array");
  }

  const goals = obj.goals.map(deserializeGoal);
  const tasks = obj.tasks.map(deserializeTask);

  return createProject({
    id: obj.id,
    name: obj.name,
    description: typeof obj.description === "string" ? obj.description : "",
    tasks,
    goals,
  });
}

function deserializeGoal(data: unknown): Goal {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid goal data: expected an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== "string" || !obj.id) {
    throw new Error("Invalid goal data: missing or empty id");
  }

  if (typeof obj.name !== "string" || !obj.name) {
    throw new Error("Invalid goal data: missing or empty name");
  }

  return createGoal({
    id: obj.id,
    name: obj.name,
    description: typeof obj.description === "string" ? obj.description : "",
  });
}

function deserializeTask(data: unknown): Task {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid task data: expected an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== "string" || !obj.id) {
    throw new Error("Invalid task data: missing or empty id");
  }

  if (typeof obj.title !== "string" || !obj.title) {
    throw new Error("Invalid task data: missing or empty title");
  }

  return createTask({
    id: obj.id,
    title: obj.title,
    description: typeof obj.description === "string" ? obj.description : "",
    status: isValidTaskStatus(obj.status)
      ? (obj.status as TaskStatus)
      : undefined,
    value: typeof obj.value === "number" ? obj.value : undefined,
    urgency: typeof obj.urgency === "number" ? obj.urgency : undefined,
    estimatedEffort:
      typeof obj.estimatedEffort === "number" ? obj.estimatedEffort : undefined,
    confidence: typeof obj.confidence === "number" ? obj.confidence : undefined,
    goalId: typeof obj.goalId === "string" ? obj.goalId : undefined,
    dependencies: Array.isArray(obj.dependencies)
      ? deserializeDependencies(obj.dependencies)
      : undefined,
  });
}

function deserializeDependencies(value: unknown[]): readonly string[] {
  const dependencies: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") {
      throw new Error(
        "Invalid task data: dependency entries must be strings, got " +
          `${entry === null ? "null" : typeof entry}`,
      );
    }
    dependencies.push(entry);
  }
  return Object.freeze(dependencies);
}

const VALID_STATUSES = new Set<string>(ALL_TASK_STATUSES);

function isValidTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && VALID_STATUSES.has(value);
}
