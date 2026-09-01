# Progress

Append-only project history.

## 2026-08-09 — Project control plane drafted

Completed:
- Defined preliminary Trajectory product specification.
- Defined agent roles and repository operating model.
- Defined initial task backlog.
- Defined provisional architecture.
- Defined deterministic recommendation direction.

Human review still required:
- final product name
- scoring weights
- scheduling semantics
- final UI stack
- final MVP scenario scope
- benchmark methodology

No implementation metrics or performance claims have been made.

## 2026-08-16 — TypeScript project initialized (TASK-001)

Completed:
- Initialized npm package with `type: "module"`.
- Configured TypeScript in strict mode with `ES2022` target and `Node16` module resolution.
- Configured Vitest for unit testing with coverage support.
- Configured ESLint with TypeScript rules and Prettier for formatting.
- Created minimal smoke test to verify environment.
- Verified all commands pass: `npm run verify` (typecheck, test, lint, format).

Toolchain:
- Node.js v24.19.0, npm 11.17.0
- TypeScript (strict mode)
- Vitest v4.1.10
- ESLint v10.8.1 + typescript-eslint
- Prettier

Next: TASK-002 — Define project and task domain model.

## 2026-08-16 — Domain model implemented (TASK-002)

Completed:
- Implemented domain entities: Project, Task, Goal
- Implemented TaskStatus enum (BACKLOG, TODO, IN_PROGRESS, BLOCKED, DONE)
- Created factory functions with invariant validation
- Wrote 23 domain invariant tests (24 total with smoke test)
- Verified all commands pass: `npm run verify`

Domain model:
- `Project` — top-level container with tasks and goals
- `Task` — core entity with status, value, urgency, effort, confidence, goal reference, dependencies
- `Goal` — named objective that tasks can reference
- `TaskStatus` — enum with 5 states

Next: TASK-003 — Implement dependency graph.

## 2026-08-16 — Dependency graph implemented (TASK-003)

Completed:
- Implemented `DependencyGraph` interface with `createDependencyGraph(tasks)` factory
- Prerequisite and dependent lookup (sorted lexicographically)
- Transitive traversal (all prerequisites, all dependents)
- Reachability
- Precise cycle detection via self-reachability (excludes downstream tasks)
- Deterministic topological ordering (Kahn's algorithm with sorted ready queue)
- Construction validation: duplicate task ids and unknown dependency references rejected, repeated entries deduplicated
- Added ADR-005 documenting graph design (edge direction, determinism, cycle semantics)
- Added `.gitattributes` to fix CRLF/LF line-ending instability in format checks
- Wrote 34 graph tests (58 total passing)
- Verified all commands pass: `npm run verify`

Next: TASK-004 — Implement scheduling and critical path.

## 2026-08-18 — Scheduling and critical path implemented (TASK-004)

Completed:
- Implemented `calculateSchedule(tasks, graph)` in `src/domain/scheduling/schedule.ts`
- Forward pass: earliest start/finish using topological order
- Backward pass: latest start/finish using reverse topological order
- Slack calculation: `slack = latestStart - earliestStart`
- Critical path identification: all tasks with zero slack
- Project duration: maximum earliest finish across all tasks
- Frozen result arrays to prevent accidental mutation
- Added ADR-006 documenting scheduling semantics (duration model, CPM algorithm, critical-path definition)
- Wrote 13 scheduling tests covering: empty project, single task, linear chain, diamond with slack, independent tasks, converging paths, multiple critical paths, cycle rejection, fractional effort, determinism, immutability, and large chains
- Total: 71 tests passing across 7 test files
- Verified all commands pass: `npm run verify`

Scheduling model:
- `TaskSchedule` — per-task schedule with ES/EF/LS/LF/slack/critical flag
- `ScheduleResult` — project duration, all task schedules, critical path

Next: TASK-005 — Implement candidate selection and decision engine.

## 2026-08-22 — Decision engine implemented and documented (TASK-005)

Completed:
- Implemented `evaluateTasks(tasks, graph, schedule, factors?)` in `src/domain/decision/engine.ts`; code was merged to main via PR #4 (feat/005b-composable-factors) on 2026-08-19
- Eligibility filtering: excludes DONE tasks and tasks whose prerequisites are not all DONE
- Additive scoring model: value, urgency, dependency impact, critical-path membership, confidence, minus effort penalty — each contribution individually exposed
- Normalization against per-metric maxima of the passed-in task set, with zero-maximum guards
- Deterministic tie-breaking: descending score, then ascending task id
- Composable `ScoringFactor` interface allowing custom weights, subsets, and additional factors without engine changes
- Structured factor breakdowns (label, signed contribution, direction, source metric, explanation); frozen results
- Added ADR-007 documenting eligibility rules, scoring model, normalization, tie-breaking, and selection policy
- Marked ADR-004 Accepted now that the additive model is implemented
- Wrote 31 decision-engine tests covering eligibility, per-factor ranking monotonicity, tie-breaks, normalization boundaries, custom factors, immutability, and input-order independence
- Total: 102 tests passing across 8 test files
- Verified all commands pass: `npm run verify`

Decision model types:
- `EvaluationFactor`, `TaskEvaluation`, `EvaluationResult`
- `ScoringFactor`, `ScoringContext`, `FactorComputation`, `DEFAULT_FACTORS`

Next: TASK-006 — Implement recommendation explainability.

## 2026-08-22 — Recommendation explainability implemented (TASK-006)

Completed:
- Implemented `recommendNextTask(tasks, graph, schedule, factors?)` in `src/domain/decision/recommendation.ts`
- Wraps `evaluateTasks` without duplicating scoring logic; custom factor sets pass through
- `Recommendation` carries nullable taskId/score with an explainable empty state (`no-eligible-tasks` warning) when nothing is eligible
- Factors are machine-readable: stable ids (`value`, `urgency`, `dependency`, `criticalPath`, `confidence`, `effort`) alongside labels, signed contributions, directions, source metrics, and explanations
- Engine additions: stable factor ids on `EvaluationFactor`, normalization `maxValues` exposed on `EvaluationResult`, exported `NormalizationMaxima` type
- Fixed-order assumption list describing model semantics, including the actual normalization maxima as detail
- Conditional warnings in a fixed emission order: `tie-break-applied`, `zero-maximum-normalization`, `blocked-status-eligible`; tie detection matches ranking precision so warning and selection cannot disagree
- All output frozen and deterministic; verified by JSON-equality tests across repeated and reordered runs
- Added ADR-008 documenting the explainability representation
- Wrote 21 recommendation tests + 2 engine tests (factor ids, exposed maxima)
- Total: 125 tests passing across 9 test files
- Verified all commands pass: `npm run verify`

Explanation types:
- `Recommendation`, `Assumption`, `RecommendationWarning`

Next: TASK-007 — Implement scenario simulation.

## 2026-08-23 — TASK-006 review follow-up fixes

Completed:
- Deep freezing applied to all decision-layer result objects: individual `TaskEvaluation` and `EvaluationFactor` objects (engine) and `Assumption`/`RecommendationWarning` objects (recommendation layer) are now frozen, matching the documented immutability contract; previously only arrays and top-level results were frozen
- `buildWarnings` now takes `readonly TaskEvaluation[]` instead of an inline structural type
- Zero-maximum warning message uses readable list formatting for multiple metrics ("value, urgency, and dependent count")
- Documented in ADR-008: score-derived warnings require at least one candidate (the no-candidates path intentionally centers on `no-eligible-tasks`, with maxima still visible via the `normalization-maxima` assumption); the plan's conceptual `RecommendationFactor` is realized by reusing `EvaluationFactor`
- Added edge-case tests: element-level freeze assertions for engine and recommendation outputs, dependents-only zero-maximum warning, multi-BLOCKED sorted `affectedTaskIds`
- Reviewed findings not adopted: exposing the engine's internal task map (would leak internals to save an O(n) loop), renaming factors to a distinct `RecommendationFactor` type (duplicated shape without clarifying invariants), and a zero-effort-maximum test (unreachable — `createTask` enforces effort > 0)
- Total: 129 tests passing across 9 test files
- Verified all commands pass: `npm run verify`

## 2026-08-23 — Scenario simulation implemented (TASK-007)

Completed:
- Implemented `applyScenario(tasks, scenario)` and `simulateScenario(baselineTasks, scenario, factors?)` in `src/domain/simulation/simulation.ts` (branch feat/007-scenario-simulation)
- Three scenario kinds: `delay-task` (positive effort increase), `change-effort` (effort replacement), `remove-task` (de-scope); deadline-change scenarios deferred until a date model exists (ADR-009)
- Baseline isolation: scenarios derive new task arrays; only the targeted task is rebuilt via `createTask`, untouched tasks keep object identity; removal strips dependency references from survivors so the projected graph remains constructible
- Comparisons: baseline vs. projected `projectDuration`, `criticalPath`, `recommendedTaskId`, `recommendedScore`; deltas include rounded duration delta, critical-path change, recommendation change, and `valueRemoved` for de-scopes
- Affected downstream reporting: target plus transitive dependents whose `[earliestStart, earliestFinish]` window actually changed — reachability alone does not count as impact
- Reused existing domain layers (`createDependencyGraph`, `calculateSchedule`, `recommendNextTask`) with custom factor-set pass-through; no scheduling or scoring logic duplicated
- Deterministic and frozen output; `scenarioTasks` sorted by id for order-independent serialization; verified by JSON-equality across repeated and reordered runs
- Added ADR-009 documenting derivation-over-mutation, affected-downstream semantics, comparison shape, and the cross-side score-comparison caveat
- Wrote 20 simulation tests covering isolation, delay/effort/removal behavior, affected-downstream filtering, recommendation comparison, determinism, and freezing
- Total: 149 tests passing across 10 test files
- Verified all commands pass: `npm run verify`

Next: TASK-008 — Implement local persistence.

## 2026-08-25 — Local persistence implemented (TASK-008)

Completed:
- Implemented `ProjectRepository` interface in `src/application/repository.ts` with `save`, `load`, `list`, `delete` methods
- Implemented `StorageProvider` interface in `src/infrastructure/storage.ts` to abstract away browser API coupling
- Implemented `LocalProjectRepository` in `src/infrastructure/local-repository.ts` backed by `StorageProvider`
- Implemented versioned serialization in `src/infrastructure/serialization.ts` with `serialize`/`deserialize` functions
- Serialization format (`ProjectData`) includes `schemaVersion` field; version 1 is the initial format
- Deserialization validates schema version (rejects older and newer), validates all fields, and falls back to domain defaults for missing optional fields
- Deserialization rejects corrupted or malformed data deterministically with descriptive errors
- `list()` returns project summaries sorted by id, skipping any corrupted entries
- Barrel exports added for `src/application` and `src/infrastructure`
- Added ADR-010 documenting persistence design (StorageProvider abstraction, serialization format, schema versioning, rejection strategy)
- Wrote 31 persistence tests covering: round-trip serialization, schema version validation, field validation, default values, frozen output, repository CRUD operations, list sorting, corrupted entry handling, and JSON round-trip through storage
- Total: 180 tests passing across 11 test files
- Verified all commands pass: `npm run verify`

Persistence architecture:
- `ProjectRepository` (application layer) — the persistence contract
- `StorageProvider` (infrastructure) — abstracts key-value storage
- `LocalProjectRepository` (infrastructure) — concrete implementation
- `ProjectData` — versioned serialization format with schema validation

## 2026-08-25 — Application services implemented (TASK-009)

Completed:
- Implemented six application services: `ProjectService`, `TaskService`, `GoalService`, `DependencyService`, `RecommendationService`, `ScenarioService`
- All services use dependency injection via the `ProjectRepository` interface
- `ProjectService` — create, get, update, delete, and list projects
- `TaskService` — add, update status, remove, and get tasks within a project
- `GoalService` — add and remove goals within a project
- `DependencyService` — add and remove task prerequisite dependencies
- `RecommendationService` — get recommendations and project graph/schedule data
- `ScenarioService` — run what-if scenarios against a project
- `toCreateTaskInput` helper to bridge Task (with `goalId: string | null`) to CreateTaskInput (with `goalId?: string`)
- Barrel exports added for all application services
- Wrote 33 application service tests covering: CRUD operations, idempotency, error handling, and integration with domain logic
- Total: 213 tests passing across 17 files
- Verified all commands pass: `npm run verify`

Service architecture:
- `ProjectService` — project lifecycle management
- `TaskService` — task CRUD with dependency reference cleanup on removal
- `GoalService` — goal CRUD
- `DependencyService` — dependency graph management at the service level
- `RecommendationService` — wraps domain recommendation and graph/schedule computation
- `ScenarioService` — wraps domain scenario simulation

Next: TASK-010 — Build recommendation dashboard.

## 2026-08-26 — Recommendation dashboard implemented (TASK-010)

Completed:
- Introduced React + Vite as the UI framework (first runtime dependency)
- UI components: `Dashboard`, `ProjectSelector`, `RecommendationPanel`, `FactorBreakdown`, `WarningsPanel`, `TaskList`
- Component tests using Vitest + React Testing Library + jsdom
- 21 component tests across 7 test files
- Verified all commands pass: `npm run verify`

## 2026-08-26 — Application entry points added (TASK-010.5)

Completed:
- Created `index.html` at project root with a `#root` mount point
- Created `src/main.tsx` rendering `<App />` inside `<StrictMode>`
- Created `src/App.tsx` wiring up `LocalProjectRepository` with `createLocalStorageProvider` and passing services to `<Dashboard />`
- Created `src/infrastructure/local-storage.ts` — `createLocalStorageProvider` adapter bridging `StorageProvider` to browser `localStorage`
- Added `createLocalStorageProvider` to infrastructure barrel export
- Application is runnable via `npm run dev`; build succeeds with `npm run build`
- Verified all commands pass: `npm run verify` (typecheck, 234 tests, lint, format)

Next: TASK-011 — Build dependency visualization.

## 2026-08-26 — CRUD UI and dependency visualization implemented (TASK-011)

Completed:
- CRUD UI components: `ProjectForm`, `TaskForm`, `DependencyEditor`
- `ProjectForm` — create new projects with name and description
- `TaskForm` — add tasks with metadata (title, value, urgency, effort, confidence, status), validation for duplicate IDs
- `DependencyEditor` — add/remove task dependencies, shows current dependency list
- Sample data: `createSampleProject` with 8 realistic tasks, 2 goals, and multiple dependencies for demoing
- Dependency graph visualization: SVG-based with topological layer layout
- `graph-layout.ts` — deterministic layout algorithm using topological order for layer assignment
- Critical-path nodes visually distinguished with bold borders
- Status-colored nodes (DONE=green, IN_PROGRESS=blue, TODO=amber, BACKLOG=gray, BLOCKED=red)
- Arrow markers on edges showing dependency direction
- Legend explaining node colors and critical-path indicator
- Dashboard updated to integrate all CRUD forms, graph, and sample data button
- App.tsx updated to pass `TaskService` and `DependencyService` to Dashboard
- 19 new component tests across 5 test files (253 total passing across 27 files)
- Verified all commands pass: `npm run verify`

Next: TASK-012 — Build scenario comparison.

## 2026-08-31 — TASK-011 merged to main (with recovery)

Completed:
- TASK-011 merged to main and marked DONE.
- During a pre-TASK-012 check, main was found to be in a broken, non-compiling state: the CRUD UI branch (feat/011) had been reverted via PR #12 and only partially re-added, leaving `Dashboard.tsx` referencing components that no longer existed.
- Recovered by restoring the verified-good CRUD UI tree (2026-08-26 TASK-011 work plus the recommendation-refresh fix) onto main from the clean branch tip, and re-confirming the full state compiles and all 255 tests pass across 27 files.
- Docs updated: TASK-011 DONE, handoff moved to TASK-012.

Next: TASK-012 — Build scenario comparison.

## 2026-08-31 — Scenario comparison UI implemented (TASK-012)

Completed:
- `ScenarioPanel` component: scenario kind selector (delay-task, change-effort, remove-task), target task selector, effort input (where applicable), and a Run Scenario button
- Inline validation errors: task required, positive effort required; service errors surfaced with `role="alert"`
- Baseline vs. projected comparison table: project duration, critical path, recommended task, with duration delta and changed/unchanged indicators
- Affected downstream tasks and removed value (de-scope) reporting, with task-id→title resolution from the current project tasks
- Baseline isolation: scenarios run purely through `ScenarioService.runScenario` (which delegates to immutable domain `simulateScenario`), so user data is never mutated
- `ScenarioService` wired into `App.tsx` and `Dashboard.tsx`; `ScenarioPanel` exported from the `src/ui` barrel
- 6 new scenario panel component tests (261 total passing across 28 files)
- Verified all commands pass: `npm run verify` (typecheck, 261 tests, lint, format); build succeeds

Next: TASK-013 — Add integration and E2E coverage.

## 2026-08-31 � Integration coverage added (TASK-013)

Completed:
- Added integration test suites in `src/integration/`: `primary-workflow.test.ts` and `recommendation-scenario.test.ts`
- Integration tests drive all six application services (`ProjectService`, `GoalService`, `TaskService`, `DependencyService`, `RecommendationService`, `ScenarioService`) against a real `LocalProjectRepository` backed by an in-memory `StorageProvider`, crossing application + domain + infrastructure/serialization boundaries rather than stubbing the repository
- Primary user workflow covered: create/open project -> add goals/tasks -> add dependencies -> view recommendation + inspect factor source metrics -> run scenario -> compare result
- Persistence isolation verified: running a scenario leaves the persisted baseline unchanged in the repository
- Rich task metadata (value, urgency, effort, confidence, status, goal) round-trips intact through serialization
- Cross-service state sharing through one repository, project summaries (task/goal counts), cycle rejection across the persistence boundary, and sample-project analysis are all covered
- Scenario comparison through the real stack: baseline vs. projected duration delta, affected downstream, and removed value on de-scope
- Browser-level E2E (Playwright) deferred to TASK-016 (CI/CD); TASK-013 scoped to integration coverage
- 13 new integration tests (274 total passing across 30 files)
- Added acceptance criteria and verification for TASK-013 in docs/tasks.md
- Verified all commands pass: `npm run verify` (typecheck, 274 tests, lint, format); build succeeds

Next: TASK-014 � Benchmark algorithms.

## 2026-08-31 � Benchmark algorithms implemented (TASK-014)

Completed:
- Added `benchmark/` directory (outside `src/`) with deterministic benchmark datasets and a wall-clock measurement harness
- `benchmark/datasets.ts`: seeded LCG task-DAG generator — a given seed always yields the identical task set (id, metadata, dependencies); tasks depend only on earlier tasks so the graph is a guaranteed acyclic DAG
- `benchmark/benchmark.ts`: measures each key domain operation via a best-of-N loop (`process.hrtime.bigint()`), reporting mean + min wall-clock ms and iteration count
- Covered operations: graph construction, cycle detection, topological ordering, prerequisite/dependent lookup, transitive traversal, full-graph reachability, critical-path analysis, decision-engine scoring, recommendation explainability, and scenario simulation
- Datasets at 100, 1000, and 5000 tasks as required by TASK-014 acceptance criteria
- Determinism verified by tests: identical `topologicalOrder`/`criticalPath`/evaluation/recommendation across repeated runs, and scenario application leaves the input unmutated
- Benchmarks run as a separate npm script (`npm run benchmark`) with a dedicated Vitest config (`vitest.benchmark.config.ts`) and `tsconfig.benchmark.json`; they do not run as part of `npm test`
- Domain code is untouched — only the public domain API is exercised; the only new dev dependency is `@types/node` (type-only)
- Added ADR-011 documenting the benchmark methodology, determinism interpretation, and separation from correctness tests
- 6 new benchmark tests (validates dataset reproducibility, validity, operation determinism, and harness output)
- Verified: `npm run benchmark` prints a results table; `npm run verify` passes (typecheck, 274 tests, lint, format); `npm run build` succeeds

Next: TASK-015 — Accessibility and UX hardening.

## 2026-08-31 — Handoff update

Completed:
- TASK-013 merged to main via feat/013-integration-coverage (branch merged, marked DONE)
- TASK-014 implemented on feat/014-benchmark-algorithms

## 2026-08-31 — PR #16 review remediation (on feat/014-benchmark-algorithms)

Completed:
- Benchmark report is now an explicit output artifact: `npm run benchmark` prints a results table AND writes it to `benchmark/results.txt` (git-ignored) via a new `benchmark/report.ts` (format + persist table), emitted from the coverage test rather than a separate Node runner that could not resolve `.js`-specifier imports under Node type stripping
- Dataset sizes extended to 100/1000/5000/10000 tasks (PROJECT_PLAN §16); iteration thresholds documented (50/20/5/2)
- Dependent and transitive-dependents benchmarks now target a dependent hub (task with the most dependents, tie by lowest id) instead of a leaf, so the measurements are non-trivial — covered by a regression test
- Deactivated the dead `idx !== i` guard in the dataset generator (dataset determinism unchanged)
- UI finding #2: `TaskList` now accepts a `refreshToken` prop and reloads when project state changes (wired from `Dashboard`'s `refreshKey`), so the task table refreshes after each edit
- UI finding #3: each task row in `TaskList` now renders a status `<select>` that calls a new `onUpdateTaskStatus` prop -> `TaskService.updateTaskStatus`, and refreshes the graph/recommendation
- UI finding #4: `TaskForm.onSubmit` is awaited; fields are cleared only after a successful save (rejects leave the form intact). `Dashboard.handleAddTask` rethrows after surfacing the error so the form knows
- Docs finding #7: README `Status` and `docs/architecture.md` `Current Status` updated from "Phase 1" to the full current state (persistence, application services, UI, integration, benchmarks)
- Docs finding #8: added acceptance criteria and verification checklists to TASK-016 (CI/CD) and TASK-017 (architecture case study) in `docs/tasks.md`
- ADR-011 updated to reflect the 10,000-task dataset, documented iteration thresholds, dependent-hub targeting, and the explicit report output mechanism
- 6 new TaskList/TaskForm UI tests added (279 total correctness/component/integration tests passing across 30 files)
- Verified: `npm run verify` passes (typecheck, 279 tests, lint, format); `npm run benchmark` passes (6 tests, table printed + written); `npm run build` succeeds


## 2026-08-31 — Accessibility and UX hardening implemented (TASK-015)

Completed:
- Added a design system in `src/ui/styles.css` (imported via `main.tsx`): consistent spacing/typography/color palette via CSS custom properties, reusable card/panel surfaces, focus-visible rings, a styled loading spinner, styled empty states, tables with clear headings, warning/error surfaces, and a responsive layout (grid for scenario controls, auto-horizontal-scroll for tables, header/side adjustment) below 768px
- Added a skip link (`Skip to main content`) visible only on keyboard focus that targets the `#main-content` landmark; the app now uses a semantic `<main>` landmark
- ARIA improvements: project actions and project workspace wrapped in labeled `region`s; the SVG dependency graph marked `role=img` with a descriptive aria-label; loading states use `role=status` + `aria-live=polite`; dependency remove buttons carry explicit accessible names
- Focus management: when a project is opened, focus moves to the workspace heading so keyboard/screen-reader users land on the newly rendered content
- Added `src/vite-env.d.ts` referencing `vite/client` so the `styles.css` side-effect import type-checks
- Added `src/ui/accessibility.test.tsx` with 6 tests covering the skip link, main landmark, labeled regions, styled empty state, live status region, SVG image semantics, and remove-button accessible names
- All changes confined to the UI layer; domain/application/infrastructure untouched
- Verified: `npm run verify` passes (typecheck, 285 tests, lint, format); `npm run build` succeeds

## 2026-09-01 — TASK-015 PR review remediation (on feat/015-accessibility-ux)

Completed:
- Fixed two CSS contrast bugs raised in PR #17 review: the Trajectory heading on the dark page background was invisible (`--color-text` and `--color-bg-soft` both resolve to `#1e293b`), and table headers had a 1:1 contrast ratio for the same reason. The header heading/subtitle now use light colors on the dark background, and table headers now use a light background (`#e2e8f0`) with dark text.
- Fixed a focus-management regression in `Dashboard.tsx`: the move-focus-to-workspace effect previously fired on any `loading`/`error` change, so any refresh (e.g. adding a task) would steal keyboard focus from the control the user was using. It now only moves focus on an actual project-selection transition (tracked via a `previousProjectIdRef`).
- Added a regression test that verifies focus moves to the workspace on project selection but is not stolen by a subsequent refresh.
- Docs updated: handoff/progress note the remediation. 6 new accessibility tests + 1 new regression test (286 total passing).
- Verified: `npm run verify` passes (typecheck, 286 tests, lint, format); `npm run build` succeeds

## 2026-09-01 — TASK-015 PR follow-up: fix missing card surfaces (on feat/015-accessibility-ux)

Completed:
- Reviewer follow-up reported that form/dependency text ("Add Task", "ID", "Title", "Current Dependencies", dependency rows) blended into the page background, appearing as floating fields/buttons.
- Root cause: `TaskForm`, `ProjectForm`, and `DependencyEditor` rendered without their surface `className` (`task-form`/`project-form`/`dependency-editor`), so the card background CSS rules targeted these classes but never matched. The components sat transparent on the dark `#1e293b` page background while inheriting dark `#1e293b` text — effectively invisible.
- Fixed by adding the matching `className` to each component's root element; removed the unused `.section-card` selector from the shared surface rule.
- Also fixed the same bug for the `workspace-heading`: `Dashboard.tsx` renders an `h2.workspace-heading` directly on the dark page background, inheriting dark `#1e293b` text — added a `.workspace-heading { color: #f1f5f9 }` rule so "Project Workspace" is visible.
- Wrapped the dependency-graph SVG in a scrollable region (`.graph-scroll`, `overflow: auto` + `role="region"`) so long graphs scroll inside the white card instead of overflowing past its edge; heading and legend stay fixed. New regression test (287 total passing).
- Verified: `npm run verify` passes (typecheck, 287 tests, lint, format); `npm run build` succeeds.

## 2026-09-01 -- CI/CD implemented (TASK-016)

Completed:
- Added `.github/workflows/ci.yml` with three independent GitHub Actions jobs running on every push/PR to main
- `verify` job: runs the full local verification gate (typecheck, tests, lint, format) via `npm run verify`
- `benchmark` job: runs `npm run benchmark` and uploads `benchmark/results.txt` as a `benchmark-results` artifact (`if-no-files-found: warn`)
- `build` job: runs the production build (`npm run build`)
- All jobs use `ubuntu-latest`, Node 24, and `npm ci` with npm cache enabled via `actions/setup-node`
- No production code changes; this is purely infrastructure configuration
- TASK-015 marked DONE (merged to main via PR #17)
- Verified locally: `npm run verify` (typecheck, 287 tests, lint, format), `npm run build`, and `npm run benchmark` (6 tests) all pass
- CI itself must be verified by pushing the branch and observing the workflow run on the PR; required status checks must be configured in GitHub branch protection by a human

Next: TASK-017 -- Architecture case study and final documentation.

## 2026-09-01 -- Playwright E2E coverage added (TASK-016, part 2)

Completed:
- Added `@playwright/test` as a dev dependency (1.62.1)
- Added `playwright.config.ts`: single Chromium project, `fullyParallel` locally, self-managed dev server via `webServer` (`npm run dev`, `reuseExistingServer: !CI`), CI-specific settings (`forbidOnly`, `retries: 2`, `workers: 1`, HTML reporter), baseURL on port 5173
- Added `tsconfig.e2e.json` so E2E specs and the Playwright config are type-checked; `npm run test:e2e` runs `tsc` first, then `playwright test`
- Added two specs under `e2e/` (excluded from the Vitest suite by its `include` glob):
- `primary-journey.spec.ts` - the PROJECT_PLAN §15 journey: create project -> add tasks -> add dependency -> view recommendation -> inspect factor breakdown -> run a delay scenario (asserts `+1` duration delta and affected downstream) -> de-scope a task (asserts value removed `5` and the projected recommendation changing) -> verify the baseline project is unchanged
  - `sample-project.spec.ts` - seeds the sample project; asserts the deterministic `t4` recommendation, all six factor rows, the SVG dependency graph (`role=img`, 8 edges), critical-path marking (t8 critical, t6 not), and the legend
- Playwright artifacts (`test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`) added to `.gitignore`
- Added a fourth `e2e` job to `.github/workflows/ci.yml`: installs Chromium via `npx playwright install --with-deps chromium`, runs `npm run test:e2e`, and uploads `playwright-report` as an artifact on failure (`retention-days: 14`)
- Added ADR-012 documenting the CI/CD workflow and Playwright E2E design (job split, Playwright config, E2E/unit-test separation, report artifacts, branch protection as a human action)
- E2E learning: `<option>` elements are not "visible" to Playwright (wait with `state: "attached"`), and SVG `<line>` edges count as hidden (assert edge count instead); the sample project's critical path is t1/t2/t4/t5/t8, so t6 (slack 2) is the non-critical node to assert
- Verified locally: `npm run test:e2e` (2 specs pass), `npm run verify` (typecheck incl. e2e via its own script, 287 tests, lint, format), and `npm run build` all pass

Next: TASK-017 -- Architecture case study and final documentation.
