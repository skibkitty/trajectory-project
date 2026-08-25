import type { Task, CreateTaskInput } from "../domain/index.js";
import { createTask, createProject } from "../domain/index.js";
import type { ProjectRepository } from "./repository.js";

function toCreateTaskInput(task: Task): CreateTaskInput {
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

export class DependencyService {
  private readonly repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  async addDependency(
    projectId: string,
    taskId: string,
    prerequisiteId: string,
  ): Promise<Task> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const existingTask = project.tasks[taskIndex];

    if (existingTask.dependencies.includes(prerequisiteId)) {
      return existingTask;
    }

    const updatedTask = createTask({
      ...toCreateTaskInput(existingTask),
      dependencies: [...existingTask.dependencies, prerequisiteId],
    });

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = updatedTask;

    const updatedProject = createProject({
      ...project,
      tasks: updatedTasks,
    });

    await this.repository.save(updatedProject);
    return updatedTask;
  }

  async removeDependency(
    projectId: string,
    taskId: string,
    prerequisiteId: string,
  ): Promise<Task> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const existingTask = project.tasks[taskIndex];

    if (!existingTask.dependencies.includes(prerequisiteId)) {
      return existingTask;
    }

    const updatedTask = createTask({
      ...toCreateTaskInput(existingTask),
      dependencies: existingTask.dependencies.filter(
        (dep) => dep !== prerequisiteId,
      ),
    });

    const updatedTasks = [...project.tasks];
    updatedTasks[taskIndex] = updatedTask;

    const updatedProject = createProject({
      ...project,
      tasks: updatedTasks,
    });

    await this.repository.save(updatedProject);
    return updatedTask;
  }
}
