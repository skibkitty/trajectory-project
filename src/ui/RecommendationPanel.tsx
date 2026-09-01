import { useState, useEffect, useCallback } from "react";
import type { RecommendationService } from "../application/recommendation-service.js";
import type { Recommendation } from "../domain/index.js";
import { FactorBreakdown } from "./FactorBreakdown.js";
import { WarningsPanel } from "./WarningsPanel.js";

export interface RecommendationPanelProps {
  projectId: string;
  recommendationService: RecommendationService;
  refreshToken?: number;
}

export function RecommendationPanel({
  projectId,
  recommendationService,
  refreshToken,
}: RecommendationPanelProps) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [taskTitles, setTaskTitles] = useState<ReadonlyMap<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendation = useCallback(async () => {
    setRecommendation(null);
    setLoading(true);
    setError(null);
    try {
      const [rec, graphData] = await Promise.all([
        recommendationService.getRecommendation(projectId),
        recommendationService.getGraph(projectId),
      ]);
      setRecommendation(rec);
      const titles = new Map<string, string>();
      for (const task of graphData.tasks) {
        titles.set(task.id, task.title);
      }
      setTaskTitles(titles);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recommendation",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, recommendationService]);

  useEffect(() => {
    void loadRecommendation();
  }, [loadRecommendation, refreshToken]);

  if (loading) {
    return (
      <section className="recommendation-panel" aria-live="polite">
        <div className="loading" role="status">
          Loading recommendation...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="recommendation-panel">
        <div className="error" role="alert">
          {error}
        </div>
      </section>
    );
  }

  if (!recommendation) {
    return null;
  }

  if (recommendation.taskId === null) {
    return (
      <section
        className="recommendation-panel"
        data-testid="recommendation-panel"
      >
        <h2>Recommendation</h2>
        <div className="empty-state">
          <p className="no-recommendation">
            No eligible tasks to recommend right now.
          </p>
        </div>
        <WarningsPanel warnings={recommendation.warnings} />
      </section>
    );
  }

  return (
    <section
      className="recommendation-panel"
      data-testid="recommendation-panel"
    >
      <h2>Recommendation</h2>
      <div className="recommendation-card" data-testid="recommendation-card">
        <div className="recommendation-task">
          <h3>
            {recommendation.taskId}
            {taskTitles.get(recommendation.taskId) && (
              <span className="task-title">
                {" — "}
                {taskTitles.get(recommendation.taskId)}
              </span>
            )}
          </h3>
          <span className="recommendation-score">
            Score: {recommendation.score}
          </span>
        </div>
      </div>

      <FactorBreakdown factors={recommendation.factors} />

      <WarningsPanel warnings={recommendation.warnings} />

      <details className="assumptions-details">
        <summary>Model assumptions</summary>
        <ul className="assumptions-list">
          {recommendation.assumptions.map((assumption) => (
            <li key={assumption.id}>
              <strong>{assumption.id}:</strong> {assumption.statement}
              {assumption.detail && (
                <span className="assumption-detail">
                  {" "}
                  ({assumption.detail})
                </span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
