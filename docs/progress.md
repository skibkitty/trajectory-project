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
