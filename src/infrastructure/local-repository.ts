import type { Project } from "../domain/index.js";
import type {
  ProjectRepository,
  ProjectSummary,
} from "../application/repository.js";
import type { StorageProvider } from "./storage.js";
import { serialize, deserialize } from "./serialization.js";

const PROJECT_KEY_PREFIX = "trajectory:project:";

function projectKey(id: string): string {
  return `${PROJECT_KEY_PREFIX}${id}`;
}

export class LocalProjectRepository implements ProjectRepository {
  private readonly storage: StorageProvider;

  constructor(storage: StorageProvider) {
    this.storage = storage;
  }

  async save(project: Project): Promise<void> {
    const data = serialize(project);
    const json = JSON.stringify(data);
    this.storage.setItem(projectKey(project.id), json);
  }

  async load(id: string): Promise<Project | null> {
    const json = this.storage.getItem(projectKey(id));
    if (json === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(json);
    return deserialize(parsed);
  }

  async list(): Promise<readonly ProjectSummary[]> {
    const summaries: ProjectSummary[] = [];

    for (const key of this.storage.keys()) {
      if (!key.startsWith(PROJECT_KEY_PREFIX)) {
        continue;
      }

      const json = this.storage.getItem(key);
      if (json === null) {
        continue;
      }

      try {
        const parsed: unknown = JSON.parse(json);
        const project = deserialize(parsed);
        summaries.push({
          id: project.id,
          name: project.name,
          description: project.description,
          taskCount: project.tasks.length,
          goalCount: project.goals.length,
        });
      } catch {
        continue;
      }
    }

    return Object.freeze(summaries.sort((a, b) => a.id.localeCompare(b.id)));
  }

  async delete(id: string): Promise<boolean> {
    const key = projectKey(id);
    const existing = this.storage.getItem(key);
    if (existing === null) {
      return false;
    }
    this.storage.removeItem(key);
    return true;
  }
}
