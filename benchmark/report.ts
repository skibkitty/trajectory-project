import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { OperationResult } from "./benchmark.js";

/**
 * Render a human-readable results table from benchmark measurements.
 */
export function formatResultsTable(
  results: readonly OperationResult[],
): string {
  const widths = { operation: 30, tasks: 6, mean: 10, min: 10, iterations: 10 };

  const header =
    "operation".padEnd(widths.operation) +
    "tasks".padStart(widths.tasks) +
    "mean (ms)".padStart(widths.mean) +
    "min (ms)".padStart(widths.min) +
    "iterations".padStart(widths.iterations);

  const sep = "-".repeat(header.length);
  const lines: string[] = [header, sep];

  for (const r of results) {
    lines.push(
      r.operation.padEnd(widths.operation) +
        String(r.taskCount).padStart(widths.tasks) +
        r.meanMs.toFixed(3).padStart(widths.mean) +
        r.minMs.toFixed(3).padStart(widths.min) +
        String(r.iterations).padStart(widths.iterations),
    );
  }

  lines.push(sep);
  lines.push(`Total measurements: ${results.length}`);
  return lines.join("\n");
}

/**
 * Persist a benchmark results table to disk as an explicit output artifact.
 * This is the guaranteed way `npm run benchmark` emits its promised report,
 * independent of whether a runner captures console output.
 */
export function writeResultsFile(
  results: readonly OperationResult[],
  filePath: string,
): void {
  const content =
    "Trajectory algorithm benchmarks (deterministic datasets)\n\n" +
    formatResultsTable(results) +
    "\n";
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}
