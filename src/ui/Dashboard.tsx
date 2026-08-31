import { useState, useEffect, useCallback } from "react";
import type { ProjectSummary } from "../application/repository.js";
import { ProjectSelector } from "./ProjectSelector.js";
import { RecommendationPanel } from "./RecommendationPanel.js";
import { TaskList } from "./TaskList.js";

export interface DashboardProps {
  projectService: import("../application/project-service.js").ProjectService;
  recommendationService: import("../application/recommendation-service.js").RecommendationService;
}

export function Dashboard({
  projectService,
  recommendationService,
}: DashboardProps) {
  const [projects, setProjects] = useState<readonly ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await projectService.listProjects();
      setProjects(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [projectService]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="dashboard" data-testid="dashboard">
      <header className="dashboard-header">
        <h1>Trajectory</h1>
        <p className="dashboard-subtitle">Explainable project planning</p>
      </header>

      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      {loading && <div className="loading">Loading...</div>}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {selectedProjectId && !loading && !error && (
        <section data-testid="project-workspace">
          <RecommendationPanel
            projectId={selectedProjectId}
            recommendationService={recommendationService}
            refreshToken={refreshKey}
          />

          <TaskForm
            existingTaskIds={graphTasks.map((t) => t.id)}
            onSubmit={handleAddTask}
          />

          <DependencyEditor
            tasks={graphTasks}
            onAddDependency={handleAddDependency}
            onRemoveDependency={handleRemoveDependency}
          />

          {graph && schedule && (
            <DependencyGraphVisualization
              tasks={graphTasks}
              graph={graph}
              schedule={schedule}
            />
          )}

      {selectedProjectId && !loading && !error && (
        <TaskList
          projectId={selectedProjectId}
          recommendationService={recommendationService}
        />
      )}
    </div>
  );
}
