# Current Handoff

## Phase

Domain core complete (Phases 1–4 of the implementation plan: model, graph, scheduling, decision engine)

## Current Task

TASK-006 — Implement recommendation explainability

## State

TASK-005 is complete and merged to main (PR #4, feat/005b-composable-factors). The deterministic decision engine evaluates eligible candidates with a composable additive scoring model, documented normalization and tie-breaking (ADR-007), and structured per-factor breakdowns. The next task is to deepen explainability into a full recommendation structure with machine-readable factors, assumptions, and warnings.

## Completed

- PROJECT_PLAN.md
- AGENTS.md
- opencode.json (default_agent: builder)
- agent definitions (builder, tester, reviewer, orchestrator)
- architecture document
- decision record (ADR-001 through ADR-007)
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

## Not Yet Started

- recommendation assumptions/warnings layer (TASK-006)
- scenario simulation
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

Implement TASK-006 — Implement recommendation explainability.

## Verification

TASK-005 verification is complete. All commands pass: `npm run verify` (typecheck, 102 tests, lint, format).

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
