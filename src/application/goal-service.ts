import type { Goal, Task, CreateGoalInput } from "../domain/index.js";
import { createGoal, createTask, createProject } from "../domain/index.js";
import type { ProjectRepository } from "./repository.js";

function toCreateTaskInput(task: Task) {
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

export class GoalService {
  private readonly repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  async addGoal(projectId: string, input: CreateGoalInput): Promise<Goal> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const newGoal = createGoal(input);
    const duplicate = project.goals.find((g) => g.id === newGoal.id);
    if (duplicate) {
      throw new Error(`Goal already exists: ${newGoal.id}`);
    }

    const updatedProject = createProject({
      ...project,
      goals: [...project.goals, newGoal],
    });

    await this.repository.save(updatedProject);
    return newGoal;
  }

  async removeGoal(projectId: string, goalId: string): Promise<void> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const goalExists = project.goals.some((g) => g.id === goalId);
    if (!goalExists) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    const remainingGoals = project.goals.filter((g) => g.id !== goalId);

    const updatedTasks = project.tasks.map((t) => {
      if (t.goalId === goalId) {
        return createTask({ ...toCreateTaskInput(t), goalId: undefined });
      }
      return t;
    });

    const updatedProject = createProject({
      ...project,
      tasks: updatedTasks,
      goals: remainingGoals,
    });

    await this.repository.save(updatedProject);
  }
}
