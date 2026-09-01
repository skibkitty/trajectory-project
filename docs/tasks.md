# Task Backlog

Status values:

- BACKLOG
- READY
- CLAIMED
- IN_PROGRESS
- BLOCKED
- REVIEW
- CHANGES_REQUESTED
- VERIFIED
- DONE

Only one builder should claim a task at a time.

## TASK-000 — Establish project control plane

Status: DONE

Goal:
Create and validate the repository documentation and OpenCode operating model.

Prerequisites:
None.

Acceptance criteria:
- PROJECT_PLAN.md exists.
- AGENTS.md exists.
- OpenCode project configuration exists.
- Agent roles are documented.
- Architecture, decisions, progress, handoff, and task files exist.
- Repository structure is understandable to a new agent.

Verification:
- Inspect files.
- Validate JSON configuration syntax.

## TASK-001 — Initialize TypeScript project

Status: DONE

Goal:
Create the smallest justified TypeScript development environment.

Prerequisites:
TASK-000

Acceptance criteria:
- package manager selected and documented
- TypeScript configured in strict mode
- test runner configured
- lint/format strategy documented
- minimal verification command succeeds

Verification:
- typecheck
- test
- lint if configured

## TASK-002 — Define project and task domain model

Status: DONE

Goal:
Implement the first domain entities and invariants.

Prerequisites:
TASK-001

Acceptance criteria:
- Project model exists.
- Task model exists.
- Goal model exists if required by final domain design.
- Required invariants are tested.
- Domain code has no UI/browser dependency.

## TASK-003 — Implement dependency graph

Status: DONE

Goal:
Represent and analyze task dependencies.

Prerequisites:
TASK-002

Acceptance criteria:
- prerequisite lookup
- dependent lookup
- traversal
- cycle detection
- deterministic topological ordering
- edge-case tests

## TASK-004 — Implement scheduling and critical path

Status: DONE

Goal:
Calculate deterministic scheduling information from task durations and dependencies.

Prerequisites:
TASK-003

Acceptance criteria:
- scheduling semantics documented
- critical path computed
- edge cases tested
- algorithm remains framework-independent

## TASK-005 — Implement candidate selection and decision engine

Status: DONE

Goal:
Recommend the best eligible next task.

Prerequisites:
TASK-004

Acceptance criteria:
- eligibility rules implemented
- scoring model documented
- deterministic tie-breaking implemented
- structured factor breakdown returned
- boundary and regression tests exist

## TASK-006 — Implement recommendation explainability

Status: DONE

Goal:
Represent recommendation reasoning as structured data.

Prerequisites:
TASK-005

Acceptance criteria:
- factors are machine-readable
- factors retain source metrics
- assumptions/warnings can be represented
- explanation is deterministic

## TASK-007 — Implement scenario simulation

Status: DONE

Goal:
Compare a baseline project state with deterministic what-if scenarios.

Prerequisites:
TASK-006

Acceptance criteria:
- baseline remains unchanged
- at least task-delay scenario works
- affected downstream tasks reported
- recommendation changes can be compared
- tests cover scenario isolation

## TASK-008 — Implement local persistence

Status: DONE

Goal:
Persist projects behind a repository abstraction.

Prerequisites:
TASK-002

Acceptance criteria:
- repository interface exists
- concrete local implementation exists
- serialization is versioned
- invalid persisted state is rejected or migrated deterministically

## TASK-009 — Build application services

Status: DONE

Goal:
Connect domain operations to persistence through explicit use cases.

Prerequisites:
TASK-005, TASK-007, TASK-008

Acceptance criteria:
- application services coordinate domain logic with persistence
- project CRUD service exists
- task CRUD service exists
- goal CRUD service exists
- dependency management service exists
- recommendation service exists
- scenario service exists
- services use dependency injection (repository interface)
- services are independently testable with stub repositories

## TASK-010 — Build recommendation dashboard

Status: DONE

Goal:
Create the primary product demonstration surface.

Prerequisites:
TASK-009

Acceptance criteria:
- recommendation is immediately visible
- explanation factors are visible
- user can inspect why a task was selected

## TASK-010.5 — Add application entry points

Status: DONE

Goal:
Make the application runnable in a browser.

Prerequisites:
TASK-010

Acceptance criteria:
- index.html exists at project root with a mount point
- main.tsx renders the Dashboard into that mount point
- App.tsx provides the top-level layout
- `npm run dev` starts the dev server without errors
- the dashboard is visible in the browser

Verification:
- npm run dev starts successfully
- browser shows the Trajectory dashboard

## TASK-011 — Build project editor, CRUD UI, sample data, and dependency visualization

Status: DONE

Goal:
Let the user create and manage projects/tasks through the UI, provide sample data for demoing, and visually demonstrate graph and critical-path analysis.

Prerequisites:
TASK-010

Acceptance criteria:
- user can create a new project from the UI
- user can add tasks to a project with metadata (title, value, urgency, effort, confidence, status)
- user can add/remove task dependencies from the UI
- a sample project with realistic tasks and dependencies is seeded on first load (or available via a button)
- dependency graph is rendered visually (nodes = tasks, edges = dependencies)
- critical path is visually distinguished from non-critical tasks
- task status and metadata are visible on the graph
- cycle detection errors are shown in the UI when they occur
- recommendation updates live as project state changes

Verification:
- npm run dev → create project → add tasks → add dependencies → see graph update
- sample project loads and shows recommendation, graph, and critical path

## TASK-012 — Build scenario comparison

Status: DONE

Goal:
Let the user run and compare a scenario against baseline.

Prerequisites:
TASK-011

Acceptance criteria:
- user can choose a scenario kind (delay task, change effort, remove task)
- user can select the target task
- user can supply the scenario parameter (additional/new effort where applicable)
- running a scenario does not mutate the baseline project
- side-by-side comparison shows duration, critical path, and recommended task for baseline vs. projected
- affected downstream tasks and removed value (for de-scope) are reported
- errors are shown in the UI when they occur

Verification:
- npm run dev → open project → run a scenario → see baseline vs. projected comparison
- confirm baseline project state is unchanged after running a scenario

## TASK-013 — Add integration and E2E coverage

Status: DONE

Goal:
Protect the primary user workflow.

Prerequisites:
TASK-012

Note:
Scoped to integration coverage for this pass. Integration tests drive the application services against the real domain + infrastructure repository through the primary workflow. Browser-level E2E (Playwright) is deferred and may be introduced with CI/CD (TASK-016).

Acceptance criteria:
- integration tests exercise the primary user workflow (create/open project → create tasks → create dependencies → view recommendation → inspect explanation → run scenario → compare result)
- integration tests cross layer boundaries (application services + domain + real local repository) rather than using stubbed repositories
- baseline project state is verified unchanged after running a scenario
- project summaries, cross-service state sharing, cycle rejection, and rich metadata persistence round-trips are covered
- all verification commands pass

Verification:
- npm run verify passes (typecheck, tests, lint, format)
- npm run build succeeds

## TASK-014 — Benchmark algorithms

Status: DONE

Goal:
Measure algorithm performance at meaningful graph sizes.

Prerequisites:
TASK-013

Acceptance criteria:
- benchmark tests exercise the key domain algorithms (graph construction, cycle detection, topological ordering, dependency traversal, critical-path analysis, decision-engine scoring, scenario simulation)
- benchmark datasets include at least 100, 1000, and 5000 tasks
- benchmarks report wall-clock time for each operation at each dataset size
- benchmark results are deterministic (same input produces same time-ordered results)
- benchmarks run as a separate npm script, not as part of the default test suite
- domain code has no benchmark-specific dependencies
- all verification commands continue to pass

Verification:
- npm run benchmark produces a results table
- npm run verify passes (typecheck, tests, lint, format)

## TASK-015 — Accessibility and UX hardening

Status: READY

Goal:
Make the application polished and demonstrable.

Prerequisites:
TASK-013

Acceptance criteria:
- visual design: consistent spacing, typography, color palette, and layout across all views
- keyboard navigation works for all interactive elements
- ARIA labels and roles on interactive components
- responsive behavior at common viewport widths
- loading and empty states are styled, not just text
- focus management is correct on route/state changes

Verification:
- npm run verify passes (typecheck, 285 tests, lint, format)
- npm run build succeeds

## TASK-016 — CI/CD

Status: BACKLOG

Goal:
Automate verification and deployment.

Prerequisites:
TASK-013

Acceptance criteria:
- a CI workflow runs on every push/PR to main and the default branch
- the workflow runs the full local verification gate (typecheck, tests, lint, format) equivalent to `npm run verify`
- the workflow runs the benchmark suite (or CI-friendly subset) so regressions in the benchmark harness are caught
- the production build is verified (`npm run build`) in CI
- failing checks block merge (via GitHub branch protection or required status checks)
- test artifacts (e.g. the benchmark results report) are available for inspection
- E2E coverage (Playwright) is introduced here if and when scheduled

Verification:
- CI passes on a pushed feature branch and on a merge to main
- a deliberate breaking change fails CI on the affected check

## TASK-017 — Architecture case study and final documentation

Status: BACKLOG

Goal:
Document decisions, algorithms, testing, and measured performance for recruiter/interview use.

Prerequisites:
TASK-014, TASK-015, TASK-016

Acceptance criteria:
- an architecture case study explains the core problem, the deterministic decision engine, dependency-graph and critical-path analysis, explainability, and scenario simulation at a level a technical interviewer can follow
- documented decisions (docs/decisions.md) reflect the implemented system
- algorithm descriptions match the implemented code, including documented tradeoffs and open options
- measured performance is reported from the actual benchmark suite (see TASK-014), with methodology and machine context, and no unmeasured claims are made
- testing strategy is documented, including unit/integration/component coverage and how to run each suite
- project naming and availability decisions are resolved
- the resume story (PROJECT_PLAN §24) is updated only with measurements actually produced

Verification:
- review the case study and supporting docs for accuracy against the code
- confirm every performance claim traces to a benchmark result in the repo
