import { createContext, useContext } from "react";
import type { ProjectService } from "../application/project-service.js";
import type { RecommendationService } from "../application/recommendation-service.js";

export interface DashboardContextValue {
  projectService: ProjectService;
  recommendationService: RecommendationService;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  projectService,
  recommendationService,
  children,
}: {
  projectService: ProjectService;
  recommendationService: RecommendationService;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider
      value={{ projectService, recommendationService }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (context === null) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider",
    );
  }
  return context;
}
