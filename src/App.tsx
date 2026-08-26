import { LocalProjectRepository } from "./infrastructure/local-repository.js";
import { createLocalStorageProvider } from "./infrastructure/local-storage.js";
import { ProjectService } from "./application/project-service.js";
import { RecommendationService } from "./application/recommendation-service.js";
import { Dashboard } from "./ui/Dashboard.js";

const repository = new LocalProjectRepository(createLocalStorageProvider());
const projectService = new ProjectService(repository);
const recommendationService = new RecommendationService(repository);

export function App() {
  return (
    <Dashboard
      projectService={projectService}
      recommendationService={recommendationService}
    />
  );
}
