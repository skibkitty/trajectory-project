import { expect, test } from "@playwright/test";

test.describe("sample project demo", () => {
  test("seeds the sample project and renders its recommendation, dependency graph, and critical path", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Seed the sample project
    await page.getByTestId("seed-sample-button").click();
    await expect(page.locator("#project-select")).toContainText(
      "Trajectory Demo",
    );

    // 2. Open it
    const sampleOption = page.locator("#project-select option", {
      hasText: "Trajectory Demo",
    });
    await sampleOption.waitFor({ state: "attached" });
    await page
      .locator("#project-select")
      .selectOption((await sampleOption.getAttribute("value")) ?? "");
    await expect(page.getByTestId("workspace-heading")).toBeVisible();

    // 3. Deterministic recommendation with a full factor breakdown
    await expect(page.getByTestId("recommendation-card")).toContainText("t4");
    await expect(page.getByTestId("factor-value")).toBeVisible();
    await expect(page.getByTestId("factor-urgency")).toBeVisible();
    await expect(page.getByTestId("factor-dependency")).toBeVisible();
    await expect(page.getByTestId("factor-criticalPath")).toBeVisible();
    await expect(page.getByTestId("factor-confidence")).toBeVisible();
    await expect(page.getByTestId("factor-effort")).toBeVisible();

    // 4. Dependency graph renders edges and nodes with critical-path marking
    const graph = page.getByTestId("graph-svg");
    await expect(graph).toHaveAttribute("role", "img");
    await expect(graph.getByTestId("graph-node-t8")).toHaveAttribute(
      "data-critical",
      "true",
    );
    await expect(graph.getByTestId("graph-node-t6")).toHaveAttribute(
      "data-critical",
      "false",
    );
    await expect(graph.getByTestId("graph-edge")).toHaveCount(8);
    await expect(page.getByTestId("graph-legend")).toContainText(
      "Critical path",
    );
  });
});
