import type { ProjectSummary } from "../application/repository.js";

export interface ProjectSelectorProps {
  projects: readonly ProjectSummary[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectSelectorProps) {
  return (
    <section className="project-selector" data-testid="project-selector">
      <label htmlFor="project-select">Select project</label>
      <select
        id="project-select"
        value={selectedProjectId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            onSelectProject(value);
          }
        }}
      >
        <option value="">-- choose a project --</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name} ({project.taskCount} tasks)
          </option>
        ))}
      </select>
    </section>
  );
}
