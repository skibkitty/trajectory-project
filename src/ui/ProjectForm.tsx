import { useState } from "react";

export interface ProjectFormProps {
  onSubmit: (name: string, description: string) => void;
}

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
      setName("");
      setDescription("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="project-form"
      data-testid="project-form"
    >
      <h2>Create Project</h2>
      <div>
        <label htmlFor="project-name">Name</label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="project-name-input"
        />
      </div>
      <div>
        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="project-description-input"
        />
      </div>
      <button type="submit" data-testid="create-project-button">
        Create Project
      </button>
    </form>
  );
}
