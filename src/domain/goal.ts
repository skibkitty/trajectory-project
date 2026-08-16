export interface Goal {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface CreateGoalInput {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

export function createGoal(input: CreateGoalInput): Goal {
  if (!input.id) {
    throw new Error("Goal id is required");
  }
  if (!input.name) {
    throw new Error("Goal name is required");
  }
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? "",
  };
}
