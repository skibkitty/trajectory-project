export { TaskStatus, ALL_TASK_STATUSES } from "./task-status.js";
export type { TaskStatus as TaskStatusValue } from "./task-status.js";

export { createGoal } from "./goal.js";
export type { Goal, CreateGoalInput } from "./goal.js";

export { createTask } from "./task.js";
export type { Task, CreateTaskInput } from "./task.js";

export { createProject } from "./project.js";
export type { Project, CreateProjectInput } from "./project.js";

export { createDependencyGraph } from "./graph/dependency-graph.js";
export type { DependencyGraph } from "./graph/dependency-graph.js";

export { calculateSchedule } from "./scheduling/schedule.js";
export type { TaskSchedule, ScheduleResult } from "./scheduling/schedule.js";

export { evaluateTasks, DEFAULT_FACTORS } from "./decision/engine.js";
export type {
  EvaluationFactor,
  TaskEvaluation,
  EvaluationResult,
  ScoringFactor,
  ScoringContext,
  FactorComputation,
  NormalizationMaxima,
} from "./decision/engine.js";

export { recommendNextTask } from "./decision/recommendation.js";
export type {
  Recommendation,
  Assumption,
  RecommendationWarning,
} from "./decision/recommendation.js";

export { applyScenario, simulateScenario } from "./simulation/simulation.js";
export type {
  Scenario,
  DelayTaskScenario,
  ChangeEffortScenario,
  RemoveTaskScenario,
  SimulationSide,
  SimulationResult,
} from "./simulation/simulation.js";
