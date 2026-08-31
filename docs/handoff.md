# Current Handoff

## Phase

Domain core complete (Phases 1–5 of the implementation plan: model, graph, scheduling, decision engine, scenario simulation). Persistence implemented. Application services implemented. UI foundation complete. CRUD UI and dependency visualization complete. Scenario comparison complete. Integration coverage in progress.

## Current Task

TASK-013 — Add integration and E2E coverage (in progress; implemented on feat/013-integration-coverage) — scoped to integration tests for this pass; browser E2E deferred to TASK-016

## State

TASK-013 adds integration tests that protect the primary user workflow across the real stack. Tests in `src/integration/` drive the application services (`ProjectService`, `GoalService`, `TaskService`, `DependencyService`, `RecommendationService`, `ScenarioService`) against a real `LocalProjectRepository` backed by an in-memory `StorageProvider` — i.e. crossing application + domain + infrastructure/serialization boundaries rather than using stub repositories. 274 tests pass (261 prior + 13 new integration tests).

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
- CRUD UI: `ProjectForm`, `TaskForm`, `DependencyEditor` components
- Sample data: `createSampleProject` with realistic tasks, dependencies, and goals
- Dependency graph visualization: SVG-based with topological layout, critical-path highlighting, status colors, and legend
- Graph layout utility: `computeLayout` with deterministic layer assignment
- 19 new component tests (253 total passing across 27 files)
- TASK-011 merged to main and marked DONE; main restored to the verified-good CRUD UI state after a partial revert caused a broken merge (255 tests passing across 27 files)
- Scenario comparison UI: `ScenarioPanel` component (scenario kind, target task, and effort inputs; baseline vs. projected comparison table; affected-downstream and value-removed reporting; inline validation errors)
- `ScenarioService` wired through `App.tsx` and `Dashboard.tsx`; `ScenarioPanel` exported from the UI barrel
- 6 new scenario panel component tests (261 total passing across 28 files)
- Integration coverage: `src/integration/primary-workflow.test.ts` and `src/integration/recommendation-scenario.test.ts`
- Integration tests drive all six application services against a real `LocalProjectRepository` (in-memory `StorageProvider` that round-trips through actual serialization), crossing application + domain + infrastructure boundaries instead of stubbing the repository
- Primary workflow covered: create/open project → add goals/tasks → add dependencies → recommendation + factor inspection → run scenario → compare result
- Persistence isolation verified: running a scenario leaves the persisted baseline unchanged; rich task metadata round-trips intact
- Cross-service state sharing through one repository, project summaries (task/goal counts), cycle rejection across the persistence boundary, and sample-project analysis are all covered
- 13 new integration tests (274 total passing across 30 files)

## Not Yet Started

- Browser-level E2E coverage (deferred to TASK-016 CI/CD)

## Human Decisions Still Needed

These are intentionally provisional:

1. Final product name and availability.
2. Exact decision-engine weights.
3. Exact scheduling/calendar semantics.
4. Final MVP scenario scope.
5. Benchmark methodology.

## Next Recommended Action

Merge TASK-013 to main, then proceed to TASK-014 — Benchmark algorithms.

## Verification

TASK-013 verification is complete. All commands pass: `npm run verify` (typecheck, 274 tests, lint, format). Build succeeds: `npm run build`.

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
