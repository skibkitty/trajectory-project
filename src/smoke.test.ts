import { describe, it, expect } from "vitest";
import { add } from "./smoke.js";

describe("smoke", () => {
  it("adds two numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
