import type { Project } from "../domain/index.js";

export interface ProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly taskCount: number;
  readonly goalCount: number;
}

export interface ProjectRepository {
  save(project: Project): Promise<void>;
  load(id: string): Promise<Project | null>;
  list(): Promise<readonly ProjectSummary[]>;
  delete(id: string): Promise<boolean>;
}
