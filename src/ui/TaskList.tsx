import { useState, useEffect, useCallback } from "react";
import type { RecommendationService } from "../application/recommendation-service.js";
import type { Task, ScheduleResult } from "../domain/index.js";

export interface TaskListProps {
  projectId: string;
  recommendationService: RecommendationService;
}

export function TaskList({ projectId, recommendationService }: TaskListProps) {
  const [tasks, setTasks] = useState<readonly Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = useCallback(async () => {
    setTasks([]);
    setSchedule(null);
    setLoading(true);
    setError(null);
    try {
      const graphData = await recommendationService.getGraph(projectId);
      setTasks(graphData.tasks);
      setSchedule(graphData.schedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [projectId, recommendationService]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  if (error) {
    return (
      <div className="error" role="alert">
        {error}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="task-list" data-testid="task-list">
        <h2>Project Tasks</h2>
        <p>No tasks in this project.</p>
      </section>
    );
  }

  const scheduleMap = new Map(
    schedule?.taskSchedules.map((s) => [s.taskId, s]) ?? [],
  );

  const sortedTasks = [...tasks].sort((a, b) => {
    return a.id.localeCompare(b.id);
  });

  return (
    <section className="task-list" data-testid="task-list">
      <h2>Project Tasks</h2>
      <table className="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Status</th>
            <th>Value</th>
            <th>Urgency</th>
            <th>Effort</th>
            <th>Confidence</th>
            <th>Critical</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => {
            const taskSchedule = scheduleMap.get(task.id);
            return (
              <tr key={task.id} data-testid={`task-row-${task.id}`}>
                <td>
                  <strong>{task.id}</strong>
                  {task.title && (
                    <span className="task-title"> — {task.title}</span>
                  )}
                </td>
                <td>{task.status}</td>
                <td>{task.value}</td>
                <td>{task.urgency}</td>
                <td>{task.estimatedEffort}</td>
                <td>{(task.confidence * 100).toFixed(0)}%</td>
                <td>{taskSchedule?.isCritical ? "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
