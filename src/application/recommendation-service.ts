import type {
  Task,
  DependencyGraph,
  ScheduleResult,
  ScoringFactor,
  Recommendation,
} from "../domain/index.js";
import {
  createDependencyGraph,
  calculateSchedule,
  recommendNextTask,
} from "../domain/index.js";
import type { ProjectRepository } from "./repository.js";

export class RecommendationService {
  private readonly repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  async getRecommendation(
    projectId: string,
    factors?: readonly ScoringFactor[],
  ): Promise<Recommendation> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (project.tasks.length === 0) {
      return {
        taskId: null,
        score: null,
        factors: [],
        assumptions: [],
        warnings: [
          {
            id: "no-eligible-tasks",
            message: "No tasks available for recommendation",
            affectedTaskIds: [],
          },
        ],
      };
    }

    const graph = createDependencyGraph(project.tasks);
    const schedule = calculateSchedule(project.tasks, graph);

    const recommendation = factors
      ? recommendNextTask(project.tasks, graph, schedule, factors)
      : recommendNextTask(project.tasks, graph, schedule);

    return recommendation;
  }

  async getGraph(projectId: string): Promise<{
    tasks: readonly Task[];
    graph: DependencyGraph;
    schedule: ScheduleResult;
  }> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const graph = createDependencyGraph(project.tasks);
    const schedule = calculateSchedule(project.tasks, graph);

    return { tasks: project.tasks, graph, schedule };
  }
}
