import type { CreateProjectInput } from "../domain/index.js";
import { createTask, createGoal } from "../domain/index.js";

export function createSampleProject(): CreateProjectInput {
  const goal1 = createGoal({ id: "g1", name: "Launch MVP" });
  const goal2 = createGoal({ id: "g2", name: "Quality & Reliability" });

  const tasks = [
    createTask({
      id: "t1",
      title: "Set up project scaffolding",
      status: "DONE",
      value: 3,
      urgency: 5,
      estimatedEffort: 1,
      confidence: 1,
      goalId: "g1",
    }),
    createTask({
      id: "t2",
      title: "Design database schema",
      status: "DONE",
      value: 5,
      urgency: 4,
      estimatedEffort: 2,
      confidence: 0.9,
      goalId: "g1",
      dependencies: ["t1"],
    }),
    createTask({
      id: "t3",
      title: "Implement authentication",
      status: "TODO",
      value: 7,
      urgency: 6,
      estimatedEffort: 3,
      confidence: 0.8,
      goalId: "g1",
      dependencies: ["t2"],
    }),
    createTask({
      id: "t4",
      title: "Build API endpoints",
      status: "TODO",
      value: 8,
      urgency: 5,
      estimatedEffort: 4,
      confidence: 0.7,
      goalId: "g1",
      dependencies: ["t2"],
    }),
    createTask({
      id: "t5",
      title: "Create frontend dashboard",
      status: "TODO",
      value: 9,
      urgency: 7,
      estimatedEffort: 5,
      confidence: 0.6,
      goalId: "g1",
      dependencies: ["t4"],
    }),
    createTask({
      id: "t6",
      title: "Write integration tests",
      status: "BACKLOG",
      value: 6,
      urgency: 3,
      estimatedEffort: 3,
      confidence: 0.8,
      goalId: "g2",
      dependencies: ["t4"],
    }),
    createTask({
      id: "t7",
      title: "Set up CI/CD pipeline",
      status: "BACKLOG",
      value: 5,
      urgency: 4,
      estimatedEffort: 2,
      confidence: 0.9,
      goalId: "g2",
      dependencies: ["t1"],
    }),
    createTask({
      id: "t8",
      title: "Performance optimization",
      status: "BACKLOG",
      value: 4,
      urgency: 2,
      estimatedEffort: 3,
      confidence: 0.5,
      goalId: "g2",
      dependencies: ["t5", "t6"],
    }),
  ];

  return {
    id: "sample-project",
    name: "Trajectory Demo",
    description:
      "A sample project demonstrating Trajectory's recommendation engine, dependency analysis, and critical-path visualization.",
    tasks,
    goals: [goal1, goal2],
  };
}
