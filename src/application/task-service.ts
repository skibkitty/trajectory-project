import type { Task, CreateTaskInput, TaskStatus } from "../domain/index.js";
import { createTask, createProject } from "../domain/index.js";
import type { ProjectRepository } from "./repository.js";
import { toCreateTaskInput } from "./task-input.js";

export class TaskService {
  private readonly repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  async addTask(projectId: string, input: CreateTaskInput): Promise<Task> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const newTask = createTask(input);
    const duplicate = project.tasks.find((t) => t.id === newTask.id);
    if (duplicate) {
      throw new Error(`Task already exists: ${newTask.id}`);
    }

    const updatedProject = createProject({
      ...project,
      tasks: [...project.tasks, newTask],
    });

    await this.repository.save(updatedProject);
    return newTask;
  }

  async updateTaskStatus(
    projectId: string,
    taskId: string,
    status: TaskStatus,
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
    const updatedTask = createTask({
      ...toCreateTaskInput(existingTask),
      status,
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

  async removeTask(projectId: string, taskId: string): Promise<void> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const taskExists = project.tasks.some((t) => t.id === taskId);
    if (!taskExists) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const remainingTasks = project.tasks
      .filter((t) => t.id !== taskId)
      .map((t) =>
        createTask({
          ...toCreateTaskInput(t),
          dependencies: t.dependencies.filter((dep) => dep !== taskId),
        }),
      );

    const updatedProject = createProject({
      ...project,
      tasks: remainingTasks,
    });

    await this.repository.save(updatedProject);
  }

  async getTask(projectId: string, taskId: string): Promise<Task | null> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return project.tasks.find((t) => t.id === taskId) ?? null;
  }
}
