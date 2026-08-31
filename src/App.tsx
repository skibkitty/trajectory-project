import { LocalProjectRepository } from "./infrastructure/local-repository.js";
import { createLocalStorageProvider } from "./infrastructure/local-storage.js";
import { ProjectService } from "./application/project-service.js";
import { RecommendationService } from "./application/recommendation-service.js";
import { TaskService } from "./application/task-service.js";
import { DependencyService } from "./application/dependency-service.js";
import { Dashboard } from "./ui/Dashboard.js";

const repository = new LocalProjectRepository(createLocalStorageProvider());
const projectService = new ProjectService(repository);
const recommendationService = new RecommendationService(repository);
const taskService = new TaskService(repository);
const dependencyService = new DependencyService(repository);

export function App() {
  return (
    <Dashboard
      projectService={projectService}
      recommendationService={recommendationService}
      taskService={taskService}
      dependencyService={dependencyService}
    />
  );
}
