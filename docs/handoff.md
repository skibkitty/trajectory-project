# Current Handoff

## Phase

Domain core complete (Phases 1–5 of the implementation plan: model, graph, scheduling, decision engine, scenario simulation). Persistence implemented. Application services implemented. UI foundation complete. CRUD UI and dependency visualization complete. Scenario comparison complete. Integration coverage complete. Algorithm benchmarks implemented.

## Current Task

TASK-014 — Benchmark algorithms (implemented on feat/014-benchmark-algorithms) — measures the key domain algorithms at 100, 1000, 5000, and 10,000 tasks via a deterministic dataset generator and a wall-clock best-of-N harness, run as a separate npm script. The PR (#16) review findings are being addressed on this same branch before merge.

## State

TASK-014 adds `benchmark/datasets.ts` (seeded LCG task-DAG generator at 100/1000/5000/10000 tasks), `benchmark/benchmark.ts` (best-of-N wall-clock harness reporting mean + min ms per operation per dataset size), `benchmark/report.ts` (formats and writes the results table), and `benchmark/benchmark.test.ts` (dataset reproducibility, domain-result determinism, scenario input non-mutation, dependent-hub regression, and required-coverage checks that also emit the report). `npm run benchmark` runs `tsc --noEmit -p tsconfig.benchmark.json && vitest run --config vitest.benchmark.config.ts`; it is NOT part of `npm test`. Only the public domain API is exercised; the only new dev dependency is `@types/node` (type-only). ADR-011 documents the methodology. `npm run benchmark` prints the results table AND writes it to `benchmark/results.txt` (git-ignored). 279 correctness/component/integration tests pass plus 6 benchmark tests.

PR #16 review findings remediated on this branch: benchmark report explicitly emitted (table printed + written to `benchmark/results.txt`); deactivated `idx !== i` guard in the dataset generator (determinism unchanged); dataset sizes extended to include 10,000 and iteration thresholds documented (2 for 10k); dependent/transitive-dependents benchmarks now target a dependent hub rather than a leaf ($pickDependentHub); task-list refreshes when project state changes (refreshToken from Dashboard); per-row task status `<select>` wired through `TaskService.updateTaskStatus`; `TaskForm.onSubmit` is awaitable and clears fields only after a successful save.

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
- Algorithm benchmarks: `benchmark/datasets.ts` (seeded LCG task-DAG generator), `benchmark/benchmark.ts` (best-of-N wall-clock harness), `benchmark/report.ts` (format + persist table), `benchmark/benchmark.test.ts` (determinism, coverage, dependent-hub regression, report emission)
- Benchmark covers graph construction, cycle detection, topological ordering, prerequisite/dependent lookup, transitive traversal, reachability, critical-path analysis, decision scoring, recommendation, and scenario simulation at 100/1000/5000/10000 tasks
- Benchmarks run only via `npm run benchmark` (dedicated `vitest.benchmark.config.ts` + `tsconfig.benchmark.json`), not `npm test`; new dev deps: `@types/node` (type-only)
- `npm run benchmark` prints the results table and writes it to `benchmark/results.txt` (git-ignored)
- ADR-011 documenting benchmark methodology (deterministic datasets, best-of-N timing, determinism interpretation, report output, separation from correctness tests)
- 6 benchmark tests (6/6 pass under `npm run benchmark`)

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

Address the outstanding findings in the PR #16 review before merging TASK-014. Once the branch is merged to main, proceed to TASK-015 — Accessibility and UX hardening.

## Verification

TASK-014 verification is complete. All commands pass: `npm run verify` (typecheck, 279 tests, lint, format). `npm run benchmark` prints a results table and writes `benchmark/results.txt` (6 benchmark tests pass). Build succeeds: `npm run build`.

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
