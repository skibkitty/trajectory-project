# Current Handoff

## Phase

Domain core complete (Phases 1–5 of the implementation plan: model, graph, scheduling, decision engine, scenario simulation)

## Current Task

TASK-008 — Implement local persistence

## State

TASK-007 is implemented on branch feat/007-scenario-simulation (not yet merged). The simulation layer (`applyScenario`, `simulateScenario`) derives projected project state without mutating the baseline: `delay-task`, `change-effort`, and `remove-task` scenarios are supported; deadline-change scenarios are deferred until a date model exists (ADR-009). Results compare baseline vs. projected duration, critical path, and recommended task, and report affected downstream tasks filtered to those whose schedule windows actually changed. The next task is persistence.

## Completed

- PROJECT_PLAN.md
- AGENTS.md
- opencode.json (default_agent: builder)
- agent definitions (builder, tester, reviewer, orchestrator)
- architecture document
- decision record (ADR-001 through ADR-008)
- task backlog
- progress log
- handoff document
- Git repository initialized with initial commit
- TypeScript project initialized (npm, strict mode)
- Vitest test runner configured
- ESLint + Prettier configured
- Verification commands working (typecheck, test, lint, format)
- Domain model entities: Project, Task, Goal
- TaskStatus enum (BACKLOG, TODO, IN_PROGRESS, BLOCKED, DONE)
- Factory functions with invariant validation
- Domain invariant tests (23 domain tests + 1 smoke test = 24 total passing)
- Dependency graph: prerequisite/dependent lookup, traversal, reachability, cycle detection, deterministic topological ordering
- Graph tests (34 tests = 58 total passing)
- Scheduling: forward/backward pass CPM, critical path identification, slack calculation
- Scheduling tests (13 tests = 71 total passing)
- Decision engine: eligibility rules, composable additive scoring (six default factors), deterministic lexicographic tie-breaking, structured factor breakdowns, frozen results
- Decision engine tests (31 tests = 102 total passing across 8 files)
- ADR-007 documenting eligibility, scoring model, normalization, tie-breaking, and selection policy; ADR-004 marked Accepted
- Recommendation explainability: `recommendNextTask` with machine-readable factor ids, fixed-order assumptions, ordered conditional warnings, explainable empty state, frozen deterministic output
- Engine additions: stable factor ids on `EvaluationFactor`, normalization `maxValues` exposed on `EvaluationResult`
- Review follow-up: deep freezing applied to all result objects (evaluations, factors, assumptions, warnings), `TaskEvaluation`-typed warning inputs, readable multi-metric warning formatting, additional edge-case tests
- Recommendation tests (24 tests + 1 new engine test = 129 total passing across 9 files)
- ADR-008 documenting the explainability representation
- Scenario simulation: `applyScenario` and `simulateScenario` deriving projected state without mutating the baseline
- Three scenario kinds: `delay-task`, `change-effort`, `remove-task`; deadline scenarios deferred until a date model exists (ADR-009)
- Simulation comparisons: duration delta, critical-path change, recommendation change, value removed on de-scope
- Affected-downstream reporting filtered to tasks whose schedule windows actually changed
- Simulation tests (20 tests = 149 total passing across 10 files)

## Not Yet Started

- persistence
- application services
- UI

## Human Decisions Still Needed

These are intentionally provisional:

1. Final product name and availability.
2. Exact decision-engine weights.
3. Exact scheduling/calendar semantics.
4. Final UI technology selection.
5. Final MVP scenario scope.
6. Benchmark methodology.

## Next Recommended Action

Merge feat/007-scenario-simulation, then implement TASK-008 — Implement local persistence.

## Verification

TASK-007 verification is complete. All commands pass: `npm run verify` (typecheck, 149 tests, lint, format).

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
