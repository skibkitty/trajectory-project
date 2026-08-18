# Current Handoff

## Phase

Phase 1 — Domain foundation

## Current Task

TASK-004 — Implement scheduling and critical path

## State

TASK-003 is complete. The dependency graph is implemented and verified. The next task is to implement scheduling and critical path analysis.

## Completed

- PROJECT_PLAN.md
- AGENTS.md
- opencode.json (default_agent: builder)
- agent definitions (builder, tester, reviewer, orchestrator)
- architecture document
- decision record (ADR-001 through ADR-005)
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

## Not Yet Started

- scheduling and critical path
- decision engine
- explainability
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

Implement TASK-004 — Implement scheduling and critical path.

## Verification

TASK-003 verification is complete. All commands pass: `npm run verify`.

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
