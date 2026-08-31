# Current Handoff

## Phase

Domain core complete (Phases 1–5 of the implementation plan: model, graph, scheduling, decision engine, scenario simulation). Persistence implemented. Application services implemented. UI foundation complete.

## Current Task

TASK-010.5 — Add application entry points (DONE on feat/010.5-entry-points)

## State

TASK-010 introduced React + Vite as the UI framework and implements the recommendation dashboard. TASK-010.5 adds the entry point files so the application is runnable in a browser with `npm run dev`. 234 tests pass.

## Completed

- PROJECT_PLAN.md
- AGENTS.md
- opencode.json (default_agent: builder)
- agent definitions (builder, tester, reviewer, orchestrator)
- architecture document
- decision record (ADR-001 through ADR-010)
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
- Persistence layer: `ProjectRepository` interface, `LocalProjectRepository` implementation, versioned serialization, `StorageProvider` abstraction
- ADR-010 documenting persistence design
- Persistence tests (31 tests = 180 total passing across 11 files)
- Application services: `ProjectService`, `TaskService`, `GoalService`, `DependencyService`, `RecommendationService`, `ScenarioService`
- Services use dependency injection via `ProjectRepository` interface
- Services are independently testable with stub repositories
- Application service tests (33 tests = 213 total passing across 17 files)
- React + Vite UI framework introduced (first runtime dependency)
- UI components: `Dashboard`, `ProjectSelector`, `RecommendationPanel`, `FactorBreakdown`, `WarningsPanel`, `TaskList`
- Component tests using Vitest + React Testing Library + jsdom
- 21 component tests (234 total passing across 22 files)
- Application entry points: `index.html`, `src/main.tsx`, `src/App.tsx`
- `createLocalStorageProvider` adapter bridging `StorageProvider` to browser localStorage
- Application is runnable via `npm run dev`

## Not Yet Started

- Dependency visualization (TASK-011)
- Scenario comparison UI (TASK-012)

## Human Decisions Still Needed

These are intentionally provisional:

1. Final product name and availability.
2. Exact decision-engine weights.
3. Exact scheduling/calendar semantics.
4. Final MVP scenario scope.
5. Benchmark methodology.

## Next Recommended Action

Merge feat/010.5-entry-points to main, then implement TASK-011 — Build dependency visualization.

## Verification

TASK-010.5 verification is complete. All commands pass: `npm run verify` (typecheck, 234 tests, lint, format). Build succeeds: `npm run build`. Dev server starts: `npm run dev`.

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
