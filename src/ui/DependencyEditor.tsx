import { useState } from "react";
import type { Task } from "../domain/index.js";

export interface DependencyEditorProps {
  tasks: readonly Task[];
  onAddDependency: (taskId: string, prerequisiteId: string) => void;
  onRemoveDependency: (taskId: string, prerequisiteId: string) => void;
}

export function DependencyEditor({
  tasks,
  onAddDependency,
  onRemoveDependency,
}: DependencyEditorProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedPrerequisiteId, setSelectedPrerequisiteId] =
    useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    setError(null);

    if (!selectedTaskId || !selectedPrerequisiteId) {
      setError("Select both a task and a prerequisite");
      return;
    }

    if (selectedTaskId === selectedPrerequisiteId) {
      setError("A task cannot depend on itself");
      return;
    }

    const task = tasks.find((t) => t.id === selectedTaskId);
    if (task?.dependencies.includes(selectedPrerequisiteId)) {
      setError("This dependency already exists");
      return;
    }

    onAddDependency(selectedTaskId, selectedPrerequisiteId);
    setSelectedPrerequisiteId("");
  }

  return (
    <div data-testid="dependency-editor">
      <h3>Dependencies</h3>
      {error && (
        <div className="error" role="alert" data-testid="dep-error">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="dep-task">Task</label>
        <select
          id="dep-task"
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          data-testid="dep-task-select"
        >
          <option value="">Select task...</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id} — {t.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dep-prerequisite">Depends on</label>
        <select
          id="dep-prerequisite"
          value={selectedPrerequisiteId}
          onChange={(e) => setSelectedPrerequisiteId(e.target.value)}
          data-testid="dep-prerequisite-select"
        >
          <option value="">Select prerequisite...</option>
          {tasks
            .filter((t) => t.id !== selectedTaskId)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} — {t.title}
              </option>
            ))}
        </select>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        data-testid="add-dependency-button"
      >
        Add Dependency
      </button>

      <div data-testid="dependency-list">
        <h4>Current Dependencies</h4>
        {tasks.length === 0 && <p>No tasks yet.</p>}
        {tasks.map((task) =>
          task.dependencies.map((depId) => {
            const depTask = tasks.find((t) => t.id === depId);
            return (
              <div key={`${task.id}-${depId}`} data-testid="dependency-item">
                <span>
                  {depId} ({depTask?.title ?? depId}) → {task.id} ({task.title})
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveDependency(task.id, depId)}
                  aria-label={`Remove dependency: ${depId} is prerequisite for ${task.id}`}
                  data-testid={`remove-dependency-${task.id}-${depId}`}
                >
                  Remove
                </button>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
