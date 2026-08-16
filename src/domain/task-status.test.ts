import { describe, it, expect } from "vitest";
import { TaskStatus, ALL_TASK_STATUSES } from "./task-status.js";

describe("TaskStatus", () => {
  it("has all expected statuses", () => {
    expect(ALL_TASK_STATUSES).toEqual([
      TaskStatus.BACKLOG,
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.BLOCKED,
      TaskStatus.DONE,
    ]);
  });

  it("has exactly 5 statuses", () => {
    expect(ALL_TASK_STATUSES).toHaveLength(5);
  });

  it("status values are unique", () => {
    const unique = new Set(ALL_TASK_STATUSES);
    expect(unique.size).toBe(ALL_TASK_STATUSES.length);
  });
});
