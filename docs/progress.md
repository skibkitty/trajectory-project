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
