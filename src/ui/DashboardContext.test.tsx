import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardProvider, useDashboardContext } from "./DashboardContext.js";
import { ProjectService } from "../application/project-service.js";
import { RecommendationService } from "../application/recommendation-service.js";
import type { ProjectRepository } from "../application/repository.js";

function TestConsumer() {
  const ctx = useDashboardContext();
  return (
    <div>
      <span data-testid="has-project-service">
        {ctx.projectService instanceof ProjectService ? "yes" : "no"}
      </span>
      <span data-testid="has-rec-service">
        {ctx.recommendationService instanceof RecommendationService
          ? "yes"
          : "no"}
      </span>
    </div>
  );
}

function createStubRepository(): ProjectRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(false),
  };
}

describe("DashboardProvider", () => {
  it("provides project and recommendation services", () => {
    const repo = createStubRepository();
    const projectService = new ProjectService(repo);
    const recService = new RecommendationService(repo);

    render(
      <DashboardProvider
        projectService={projectService}
        recommendationService={recService}
      >
        <TestConsumer />
      </DashboardProvider>,
    );

    expect(screen.getByTestId("has-project-service")).toHaveTextContent("yes");
    expect(screen.getByTestId("has-rec-service")).toHaveTextContent("yes");
  });

  it("throws when context is used without provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useDashboardContext must be used within a DashboardProvider",
    );

    consoleSpy.mockRestore();
  });
});
