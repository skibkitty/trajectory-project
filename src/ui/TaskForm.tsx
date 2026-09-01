import { useState } from "react";
import type { TaskStatus } from "../domain/index.js";

const STATUS_OPTIONS: readonly TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
];

export interface TaskFormProps {
  existingTaskIds: readonly string[];
  onSubmit: (input: {
    id: string;
    title: string;
    value: number;
    urgency: number;
    estimatedEffort: number;
    confidence: number;
    status: TaskStatus;
  }) => Promise<void> | void;
}

export function TaskForm({ existingTaskIds, onSubmit }: TaskFormProps) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState(5);
  const [urgency, setUrgency] = useState(5);
  const [estimatedEffort, setEstimatedEffort] = useState(2);
  const [confidence, setConfidence] = useState(0.8);
  const [status, setStatus] = useState<TaskStatus>("BACKLOG");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!id.trim() || !title.trim()) {
      setError("ID and title are required");
      return;
    }

    if (existingTaskIds.includes(id.trim())) {
      setError(`Task with ID "${id.trim()}" already exists`);
      return;
    }

    try {
      await onSubmit({
        id: id.trim(),
        title: title.trim(),
        value,
        urgency,
        estimatedEffort,
        confidence,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
      return;
    }

    setId("");
    setTitle("");
    setValue(5);
    setUrgency(5);
    setEstimatedEffort(2);
    setConfidence(0.8);
    setStatus("BACKLOG");
  }

  return (
    <form onSubmit={handleSubmit} className="task-form" data-testid="task-form">
      <h3>Add Task</h3>
      {error && (
        <div className="error" role="alert" data-testid="task-form-error">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="task-id">ID</label>
        <input
          id="task-id"
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          data-testid="task-id-input"
        />
      </div>
      <div>
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          data-testid="task-title-input"
        />
      </div>
      <div>
        <label htmlFor="task-value">
          Value: <span data-testid="task-value-display">{value}</span>
        </label>
        <input
          id="task-value"
          type="range"
          min="0"
          max="10"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          data-testid="task-value-input"
        />
      </div>
      <div>
        <label htmlFor="task-urgency">
          Urgency: <span data-testid="task-urgency-display">{urgency}</span>
        </label>
        <input
          id="task-urgency"
          type="range"
          min="0"
          max="10"
          value={urgency}
          onChange={(e) => setUrgency(Number(e.target.value))}
          data-testid="task-urgency-input"
        />
      </div>
      <div>
        <label htmlFor="task-effort">
          Effort:{" "}
          <span data-testid="task-effort-display">{estimatedEffort}</span>
        </label>
        <input
          id="task-effort"
          type="range"
          min="1"
          max="10"
          value={estimatedEffort}
          onChange={(e) => setEstimatedEffort(Number(e.target.value))}
          data-testid="task-effort-input"
        />
      </div>
      <div>
        <label htmlFor="task-confidence">
          Confidence:{" "}
          <span data-testid="task-confidence-display">{confidence}</span>
        </label>
        <input
          id="task-confidence"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          data-testid="task-confidence-input"
        />
      </div>
      <div>
        <label htmlFor="task-status">Status</label>
        <select
          id="task-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          data-testid="task-status-input"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" data-testid="add-task-button">
        Add Task
      </button>
    </form>
  );
}
