import type { Task } from "../task.js";

export interface DependencyGraph {
  readonly taskIds: readonly string[];
  getPrerequisites(taskId: string): readonly string[];
  getDependents(taskId: string): readonly string[];
  getAllPrerequisites(taskId: string): readonly string[];
  getAllDependents(taskId: string): readonly string[];
  isReachable(from: string, to: string): boolean;
  hasCycle(): boolean;
  getCyclicTaskIds(): readonly string[];
  topologicalOrder(): readonly string[];
}

function canReach(
  adjacency: ReadonlyMap<string, readonly string[]>,
  from: string,
  to: string,
): boolean {
  if (from === to) {
    const visited = new Set<string>([from]);
    const queue = [...(adjacency.get(from) ?? [])];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (node === to) {
        return true;
      }
      if (visited.has(node)) {
        continue;
      }
      visited.add(node);
      queue.push(...(adjacency.get(node) ?? []));
    }
    return false;
  }
  const visited = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === to) {
      return true;
    }
    if (visited.has(node)) {
      continue;
    }
    visited.add(node);
    queue.push(...(adjacency.get(node) ?? []));
  }
  return false;
}

function traverse(
  adjacency: ReadonlyMap<string, readonly string[]>,
  start: string,
): string[] {
  if (!adjacency.has(start)) {
    throw new Error(`Unknown task "${start}"`);
  }
  const visited = new Set<string>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const neighbor of adjacency.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  visited.delete(start);
  return [...visited].sort();
}

export function createDependencyGraph(tasks: readonly Task[]): DependencyGraph {
  const taskIds = tasks.map((task) => task.id);
  const idSet = new Set(taskIds);
  if (idSet.size !== taskIds.length) {
    throw new Error("Task ids must be unique");
  }

  const prerequisitesMap = new Map<string, string[]>();
  const dependentsMap = new Map<string, string[]>();
  for (const task of tasks) {
    prerequisitesMap.set(task.id, []);
    dependentsMap.set(task.id, []);
  }

  for (const task of tasks) {
    const seen = new Set<string>();
    for (const dependencyId of task.dependencies) {
      if (!idSet.has(dependencyId)) {
        throw new Error(
          `Task "${task.id}" references unknown dependency "${dependencyId}"`,
        );
      }
      if (seen.has(dependencyId)) {
        continue;
      }
      seen.add(dependencyId);
      prerequisitesMap.get(task.id)!.push(dependencyId);
      dependentsMap.get(dependencyId)!.push(task.id);
    }
    prerequisitesMap.get(task.id)!.sort();
  }
  for (const task of tasks) {
    dependentsMap.get(task.id)!.sort();
  }

  const lookup = (map: ReadonlyMap<string, readonly string[]>) => {
    return (taskId: string): readonly string[] => {
      const values = map.get(taskId);
      if (values === undefined) {
        throw new Error(`Unknown task "${taskId}"`);
      }
      return [...values];
    };
  };

  const getCyclicTaskIds = (): readonly string[] => {
    return [...idSet]
      .filter((taskId) => canReach(dependentsMap, taskId, taskId))
      .sort();
  };

  return {
    taskIds: [...taskIds],
    getPrerequisites: lookup(prerequisitesMap),
    getDependents: lookup(dependentsMap),
    getAllPrerequisites: (taskId) => traverse(prerequisitesMap, taskId),
    getAllDependents: (taskId) => traverse(dependentsMap, taskId),
    isReachable: (from, to) => {
      if (!idSet.has(from)) {
        throw new Error(`Unknown task "${from}"`);
      }
      if (!idSet.has(to)) {
        throw new Error(`Unknown task "${to}"`);
      }
      return canReach(dependentsMap, from, to);
    },
    hasCycle: () => getCyclicTaskIds().length > 0,
    getCyclicTaskIds,
    topologicalOrder: () => {
      const inDegree = new Map<string, number>();
      for (const taskId of taskIds) {
        inDegree.set(taskId, prerequisitesMap.get(taskId)!.length);
      }
      const ready = taskIds
        .filter((taskId) => inDegree.get(taskId) === 0)
        .sort();
      const result: string[] = [];
      while (ready.length > 0) {
        const node = ready.shift()!;
        result.push(node);
        for (const dependent of dependentsMap.get(node)!) {
          const remaining = inDegree.get(dependent)! - 1;
          inDegree.set(dependent, remaining);
          if (remaining === 0) {
            ready.push(dependent);
            ready.sort();
          }
        }
      }
      if (result.length !== taskIds.length) {
        const cyclic = getCyclicTaskIds();
        throw new Error(
          `Dependency graph contains a cycle involving tasks: ${cyclic.join(", ")}`,
        );
      }
      return result;
    },
  };
}
