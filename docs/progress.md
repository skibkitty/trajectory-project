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
