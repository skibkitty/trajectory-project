import type { Project, CreateProjectInput } from "../domain/index.js";
import { createProject } from "../domain/index.js";
import type { ProjectRepository } from "./repository.js";

export class ProjectService {
  private readonly repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const project = createProject(input);
    await this.repository.save(project);
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.repository.load(id);
  }

  async listProjects() {
    return this.repository.list();
  }

  async updateProject(
    id: string,
    updates: Partial<Pick<Project, "name" | "description">>,
  ): Promise<Project> {
    const existing = await this.repository.load(id);
    if (existing === null) {
      throw new Error(`Project not found: ${id}`);
    }
    const updated = createProject({
      ...existing,
      name: updates.name ?? existing.name,
      description: updates.description ?? existing.description,
    });
    await this.repository.save(updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
