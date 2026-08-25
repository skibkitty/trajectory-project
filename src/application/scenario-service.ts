import type {
  Scenario,
  SimulationResult,
  ScoringFactor,
} from "../domain/index.js";
import { simulateScenario } from "../domain/index.js";
import type { ProjectRepository } from "./repository.js";

export class ScenarioService {
  private readonly repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  async runScenario(
    projectId: string,
    scenario: Scenario,
    factors?: readonly ScoringFactor[],
  ): Promise<SimulationResult> {
    const project = await this.repository.load(projectId);
    if (project === null) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const result = factors
      ? simulateScenario(project.tasks, scenario, factors)
      : simulateScenario(project.tasks, scenario);

    return result;
  }
}
