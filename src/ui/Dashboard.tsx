import { useState, useEffect, useCallback, useRef } from "react";
import type { ProjectSummary } from "../application/repository.js";
import type { Task } from "../domain/index.js";
import type { DependencyGraph } from "../domain/index.js";
import type { ScheduleResult } from "../domain/index.js";
import { ProjectSelector } from "./ProjectSelector.js";
import { RecommendationPanel } from "./RecommendationPanel.js";
import { TaskList } from "./TaskList.js";
import { ProjectForm } from "./ProjectForm.js";
import { TaskForm } from "./TaskForm.js";
import { DependencyEditor } from "./DependencyEditor.js";
import { DependencyGraphVisualization } from "./DependencyGraph.js";
import { ScenarioPanel } from "./ScenarioPanel.js";
import { createSampleProject } from "./sample-data.js";

export interface DashboardProps {
  projectService: import("../application/project-service.js").ProjectService;
  recommendationService: import("../application/recommendation-service.js").RecommendationService;
  taskService: import("../application/task-service.js").TaskService;
  dependencyService: import("../application/dependency-service.js").DependencyService;
  scenarioService: import("../application/scenario-service.js").ScenarioService;
}

export function Dashboard({
  projectService,
  recommendationService,
  taskService,
  dependencyService,
  scenarioService,
}: DashboardProps) {
  const [projects, setProjects] = useState<readonly ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphTasks, setGraphTasks] = useState<readonly Task[]>([]);
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const workspaceHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const previousProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prevProjectId = previousProjectIdRef.current;
    previousProjectIdRef.current = selectedProjectId;
    if (
      selectedProjectId !== null &&
      selectedProjectId !== prevProjectId &&
      !loading &&
      !error
    ) {
      workspaceHeadingRef.current?.focus();
    }
  }, [selectedProjectId, loading, error]);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

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
  }, [loadProjects, refreshKey]);

  const loadGraph = useCallback(async () => {
    if (!selectedProjectId) {
      setGraphTasks([]);
      setGraph(null);
      setSchedule(null);
      return;
    }
    try {
      const {
        tasks: t,
        graph: g,
        schedule: s,
      } = await recommendationService.getGraph(selectedProjectId);
      setGraphTasks(t);
      setGraph(g);
      setSchedule(s);
    } catch {
      setGraphTasks([]);
      setGraph(null);
      setSchedule(null);
    }
  }, [selectedProjectId, recommendationService]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  async function handleCreateProject(name: string, description: string) {
    try {
      await projectService.createProject({
        id: `proj-${Date.now()}`,
        name,
        description,
      });
      setShowCreateForm(false);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  async function handleSeedSample() {
    try {
      const sample = createSampleProject();
      await projectService.createProject(sample);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to seed sample project",
      );
    }
  }

  async function handleAddTask(input: {
    id: string;
    title: string;
    value: number;
    urgency: number;
    estimatedEffort: number;
    confidence: number;
    status: import("../domain/index.js").TaskStatus;
  }) {
    if (!selectedProjectId) return;
    try {
      await taskService.addTask(selectedProjectId, input);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
      throw err;
    }
  }

  async function handleUpdateTaskStatus(
    taskId: string,
    status: import("../domain/index.js").TaskStatus,
  ) {
    if (!selectedProjectId) return;
    try {
      await taskService.updateTaskStatus(selectedProjectId, taskId, status);
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task status",
      );
    }
  }

  async function handleAddDependency(taskId: string, prerequisiteId: string) {
    if (!selectedProjectId) return;
    try {
      await dependencyService.addDependency(
        selectedProjectId,
        taskId,
        prerequisiteId,
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add dependency");
    }
  }

  async function handleRemoveDependency(
    taskId: string,
    prerequisiteId: string,
  ) {
    if (!selectedProjectId) return;
    try {
      await dependencyService.removeDependency(
        selectedProjectId,
        taskId,
        prerequisiteId,
      );
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove dependency",
      );
    }
  }

  return (
    <div className="dashboard" data-testid="dashboard">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="dashboard-header">
        <h1>Trajectory</h1>
        <p className="dashboard-subtitle">Explainable project planning</p>
      </header>

      <main id="main-content">
        <section data-testid="project-actions" aria-label="Project actions">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
          />
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            data-testid="toggle-create-form"
          >
            {showCreateForm ? "Cancel" : "New Project"}
          </button>
          <button
            type="button"
            onClick={handleSeedSample}
            data-testid="seed-sample-button"
          >
            Load Sample Project
          </button>
        </section>

        {showCreateForm && <ProjectForm onSubmit={handleCreateProject} />}

        {loading && (
          <div className="loading" role="status" aria-live="polite">
            Loading...
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="empty-state" data-testid="empty-state">
            <h2>No projects yet</h2>
            <p>
              Create a new project or load the sample project to see an
              explainable next-task recommendation.
            </p>
          </div>
        )}

        {selectedProjectId && !loading && !error && (
          <section
            data-testid="project-workspace"
            aria-label="Project workspace"
          >
            <h2
              ref={workspaceHeadingRef}
              tabIndex={-1}
              className="workspace-heading"
              data-testid="workspace-heading"
            >
              Project Workspace
            </h2>
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

            <ScenarioPanel
              projectId={selectedProjectId}
              scenarioService={scenarioService}
              tasks={graphTasks}
            />

            <TaskList
              projectId={selectedProjectId}
              recommendationService={recommendationService}
              refreshToken={refreshKey}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          </section>
        )}
      </main>
    </div>
  );
}
