import { vi } from "vitest";
import type { Project } from "../domain/index.js";
import type {
  ProjectRepository,
  ProjectSummary,
} from "../application/repository.js";
import type { StorageProvider } from "../infrastructure/storage.js";

export interface StubRepositoryOptions {
  /** Seed the in-memory store with an existing project. */
  readonly initialProject?: Project;
  /** Replace individual repository methods (e.g. with vi.fn() spies). */
  readonly overrides?: Partial<ProjectRepository>;
}

/**
 * In-memory ProjectRepository stub for tests. Persists projects in a Map so
 * save/load/list/delete behave like a real repository. Use `overrides` to
 * substitute a method (for example a vi.fn() with controlled resolution).
 *
 * Each base method is a vi.fn() around its behavioral implementation, so
 * tests may also reconfigure them in place via `vi.mocked(repository.x)`
 * (e.g. `vi.mocked(repository.load).mockResolvedValue(project)`).
 */
export function createStubRepository(
  options: StubRepositoryOptions = {},
): ProjectRepository {
  const store = new Map<string, Project>();
  if (options.initialProject) {
    store.set(options.initialProject.id, options.initialProject);
  }
  const repository: ProjectRepository = {
    save: vi.fn(async (project: Project) => {
      store.set(project.id, project);
    }),
    load: vi.fn(async (id: string) => store.get(id) ?? null),
    list: vi.fn(async () => {
      const summaries: ProjectSummary[] = [];
      for (const [id, project] of store) {
        summaries.push({
          id,
          name: project.name,
          description: project.description,
          taskCount: project.tasks.length,
          goalCount: project.goals.length,
        });
      }
      return Object.freeze(summaries.sort((a, b) => a.id.localeCompare(b.id)));
    }),
    delete: vi.fn(async (id: string) => store.delete(id)),
    ...options.overrides,
  };
  return repository;
}

/**
 * In-memory StorageProvider for tests. `getInternal` exposes the raw stored
 * JSON so a test can assert on the serialized format itself.
 */
export function createInMemoryStorage(): StorageProvider & {
  getInternal(key: string): string | null;
} {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    keys: () => Object.freeze([...store.keys()]),
    getInternal: (key: string) => store.get(key) ?? null,
  };
}
