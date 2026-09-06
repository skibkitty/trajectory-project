import type { Project } from "../domain/index.js";

export interface ProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly taskCount: number;
  readonly goalCount: number;
}

export interface ProjectRepository {
  /**
   * Persist a project, replacing anything stored under `project.id`.
   *
   * Id uniqueness is enforced by the application layer (check-then-save in
   * ProjectService.createProject), not atomically by the repository. A
   * concurrent or distributed backend that requires atomic uniqueness must
   * enforce it at the storage level (e.g., a unique-id constraint).
   */
  save(project: Project): Promise<void>;
  load(id: string): Promise<Project | null>;
  list(): Promise<readonly ProjectSummary[]>;
  delete(id: string): Promise<boolean>;
}
