import { expect, test, type Page } from "@playwright/test";

async function addTask(page: Page, id: string, title: string, status: string) {
  await page.getByTestId("task-id-input").fill(id);
  await page.getByTestId("task-title-input").fill(title);
  await page.getByTestId("task-status-input").selectOption(status);
  await page.getByTestId("add-task-button").click();
  await expect(page.getByTestId(`task-row-${id}`)).toBeVisible();
}

test.describe("primary user journey", () => {
  test("creates a project, adds tasks and dependencies, inspects the recommendation, and compares a scenario", async ({
    page,
  }) => {
    // 1. Open the app
    await page.goto("/");
    await expect(page.getByTestId("empty-state")).toBeVisible();

    // 2. Create a project from the UI
    await page.getByTestId("toggle-create-form").click();
    await page.getByTestId("project-name-input").fill("E2E Project");
    await page
      .getByTestId("project-description-input")
      .fill("Driven entirely from the browser.");
    await page.getByTestId("create-project-button").click();
    await expect(page.locator("#project-select")).toContainText("E2E Project");

    // 3. Open the project workspace
    const projectOption = page.locator("#project-select option", {
      hasText: "E2E Project",
    });
    await projectOption.waitFor({ state: "attached" });
    await page
      .locator("#project-select")
      .selectOption((await projectOption.getAttribute("value")) ?? "");
    await expect(page.getByTestId("workspace-heading")).toBeVisible();
    await expect(page.getByTestId("recommendation-panel")).toContainText(
      "No eligible tasks to recommend",
    );

    // 4. Add tasks (a prerequisite plus two eligible candidates)
    await addTask(page, "a", "Groundwork", "DONE");
    await addTask(page, "b", "Core build", "TODO");
    await addTask(page, "c", "Nice to have", "TODO");

    // 5. Add a dependency: b depends on a
    await page.getByTestId("dep-task-select").selectOption("b");
    await page.getByTestId("dep-prerequisite-select").selectOption("a");
    await page.getByTestId("add-dependency-button").click();
    await expect(page.getByTestId("dependency-item")).toContainText("a");
    await expect(page.getByTestId("dependency-item")).toContainText("b");

    // 6. The recommendation is visible, deterministic, and explained
    await expect(page.getByTestId("recommendation-card")).toContainText("b");
    await expect(page.getByTestId("factor-breakdown")).toBeVisible();
    await expect(page.getByTestId("factor-value")).toBeVisible();
    await expect(page.getByTestId("factor-criticalPath")).toBeVisible();
    await expect(page.getByTestId("graph-svg")).toHaveAttribute("role", "img");

    // 7. Run a delay scenario and compare against baseline
    await page.getByTestId("scenario-task-select").selectOption("b");
    await page.getByTestId("scenario-amount-input").fill("1");
    await page.getByTestId("run-scenario-button").click();
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    await expect(page.getByTestId("duration-delta")).toHaveText("+1");
    await expect(page.getByTestId("affected-downstream")).toContainText("b");

    // 8. De-scope task b and observe the recommendation change and removed value
    await page.getByTestId("scenario-kind-select").selectOption("remove-task");
    await page.getByTestId("scenario-task-select").selectOption("b");
    await page.getByTestId("run-scenario-button").click();
    await expect(page.getByTestId("value-removed")).toHaveText("5");
    await expect(page.getByTestId("scenario-comparison")).toContainText(
      "Nice to have",
    );

    // 9. The baseline project is unchanged — task b still exists
    await expect(page.getByTestId("task-row-b")).toBeVisible();
  });
});
