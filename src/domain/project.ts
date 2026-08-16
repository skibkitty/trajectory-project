import type { Goal } from "./goal.js";
import type { Task } from "./task.js";

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tasks: readonly Task[];
  readonly goals: readonly Goal[];
}

export interface CreateProjectInput {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly tasks?: readonly Task[];
  readonly goals?: readonly Goal[];
}

export function createProject(input: CreateProjectInput): Project {
  if (!input.id) {
    throw new Error("Project id is required");
  }
  if (!input.name) {
    throw new Error("Project name is required");
  }
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? "",
    tasks: input.tasks ?? [],
    goals: input.goals ?? [],
  };
}
