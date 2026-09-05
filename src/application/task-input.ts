import type { Task, CreateTaskInput } from "../domain/index.js";

/**
 * Map a persisted Task back to a CreateTaskInput so services can rebuild a
 * task through the domain factory without losing any field.
 *
 * `goalId: null` (the domain's "no goal" representation) is converted to
 * `goalId: undefined` because `CreateTaskInput.goalId` is optional — omitting
 * it produces the same `goalId: null` result in `createTask`.
 */
export function toCreateTaskInput(task: Task): CreateTaskInput {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    value: task.value,
    urgency: task.urgency,
    estimatedEffort: task.estimatedEffort,
    confidence: task.confidence,
    goalId: task.goalId ?? undefined,
    dependencies: task.dependencies,
  };
}
