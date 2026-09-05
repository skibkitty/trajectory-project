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
- benchmark results are deterministic (same input produces identical results; wall-clock timings are machine-dependent, so determinism is interpreted as identical domain results — see ADR-011)
- benchmarks run as a separate npm script, not as part of the default test suite
- domain code has no benchmark-specific dependencies
- all verification commands continue to pass

Verification:
- npm run benchmark produces a results table
- npm run verify passes (typecheck, tests, lint, format)

## TASK-015 — Accessibility and UX hardening

Status: DONE

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
- npm run verify passes (typecheck, 287 tests, lint, format)
- npm run build succeeds

## TASK-016 — CI/CD

Status: DONE

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

Status: DONE

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

## TASK-018 — Fix recommendation deep-freeze gap

Status: DONE

Goal:
Honor the ADR-008 immutability contract for recommendation warnings.

Prerequisites:
None.

Context:
ADR-008 promises "the recommendation, all of its arrays, and every contained factor/assumption/warning object are frozen." `Object.freeze` on the warning objects is shallow: the `affectedTaskIds` arrays embedded in the `tie-break-applied` and `blocked-status-eligible` warnings are built unfrozen and never frozen, so they remain runtime-mutable. This is the review finding:

- `tie-break-applied` warning embeds an unfrozen `tied` array.
- `blocked-status-eligible` warning embeds an unfrozen `blockedEligible` array.
- The existing freeze test asserts the warning objects and top-level arrays but never `Object.isFrozen` on the nested `affectedTaskIds` arrays.

Acceptance criteria:
- every `affectedTaskIds` array on every emitted warning is deeply frozen
- a regression test asserts `Object.isFrozen` on the nested arrays (and elements) for both warnings that carry them
- the commit records which warnings carry `affectedTaskIds` so a future warning type knows what to freeze

Verification:
- npm run verify passes (typecheck, tests, lint, format)
- the new freeze regression test exercises a tie and a blocked-but-eligible candidate set

## TASK-019 — Extract shared task-to-input mapper

Status: DONE

Goal:
Remove the copy-pasted `toCreateTaskInput` bridge from application services.

Prerequisites:
None.

Context:
The identical 12-line `Task → CreateTaskInput` mapper (including the `goalId: null → undefined` bridge) is defined separately in `task-service.ts`, `goal-service.ts`, and `dependency-service.ts`. A change to task fields currently forces edits in three files. Review finding: duplicated code across services.

Acceptance criteria:
- the mapper lives in exactly one shared location in the application layer
- all three services import it instead of redefining it
- behavior is unchanged (all existing service tests pass without modification of expectations)
- add a small focused test for the `goalId` bridging behavior if one does not already exist

Verification:
- npm run verify passes (typecheck, tests, lint, format)

## TASK-020 — Extract shared test helpers

Status: DONE

Goal:
Collapse the duplicated `createStubRepository` and `createInMemoryStorage` helpers into one test-support module.

Prerequisites:
None.

Context:
`createStubRepository` is re-implemented in roughly ten test files (project/task/goal/dependency/recommendation/scenario service suites plus several UI suites) and `createInMemoryStorage` in at least three more (local-repository, both integration suites). Any future addition to the `ProjectRepository` interface forces edits across those files. Review finding: shotgun surgery on the repository contract. This is additive: new helper module first, then migrate call sites, keeping CI green per batch.

Acceptance criteria:
- a single test-support module exports both helpers
- every call site imports from that module; no file defines its own copy
- all existing tests pass unchanged in expectation after migration
- the support module lives outside `src/domain` so domain dependency rules are unaffected

Verification:
- npm run verify passes (typecheck, tests, lint, format)

## TASK-021 — UI status options from domain constant

Status: DONE

Goal:
Drive the UI task-status dropdowns from the domain's `ALL_TASK_STATUSES` instead of a UI-local copy.

Prerequisites:
None.

Context:
`TaskForm.tsx` and `TaskList.tsx` each hard-code a local `STATUS_OPTIONS` list duplicating `ALL_TASK_STATUSES` in the domain. Infrastructure was already refactored to consume the domain constant; the UI is the divergent leftover, so adding a status would silently not appear in the dropdowns. Review findings: duplicated constant, plus related nits — `STATUS_COLORS` in the graph component is `Record<string, string>` masking status typos, and `as TaskStatus` casts trust DOM option values.

Acceptance criteria:
- both dropdowns render from the domain constant (or an exported UI alias derived from it), so a domain status change flows through automatically
- `STATUS_COLORS` is keyed by `TaskStatus` with no fallback that hides typos
- any `as TaskStatus` casts driven by select values are removed or made type-safe
- existing UI tests still pass; add/adjust a test asserting all domain statuses appear in the dropdown if not already covered

Verification:
- npm run verify passes (typecheck, tests, lint, format)

## TASK-022 — Persistence validation and freeze hardening

Status: DONE

Goal:
Make serialization honor the ADR-010 "reject or fall back" model and its frozen-output claim.

Prerequisites:
None.

Context:
Two review findings in `serialization.ts`:

- `dependencies` is passed to `TaskData` by reference — neither copied nor frozen — so the "serialized output is deeply frozen" claim holds only at depth 1. It also aliases the caller's mutable domain task.
- invalid (non-string) dependency entries are silently filtered out during deserialization instead of being rejected like other malformed fields or falling back to a default like `dependencies: undefined`. This is an undocumented third behavior in the ADR-010 model, and a corrupted persisted graph silently loses edges.

Acceptance criteria:
- serialized `dependencies` is copied (and frozen) so serialized output is deeply frozen and does not alias mutable input
- non-string dependency entries cause deterministic rejection (matching the field-validation behavior of other malformed fields) rather than silent filtering; the committed choice is documented in ADR-010
- tests cover: mutated caller array does not affect earlier serialized output, and rejected vs. valid dependency payloads
- ADR-010 is updated to state the chosen validation semantics for dependency entries

Verification:
- npm run verify passes (typecheck, tests, lint, format)

## TASK-023 — Guard against project id collisions

Status: DONE

Goal:
Reject duplicate project ids on creation instead of silently overwriting an existing project.

Prerequisites:
None.

Context:
The dashboard generates `proj-${Date.now()}` ids and `ProjectService.createProject` never checks whether the id already exists. Two creations in the same millisecond (or a clock collision with an existing saved project) silently overwrite an earlier project. The task/goal/dependency services all guard duplicates; project creation does not. Review finding. The fixed `sample-project` id has the same exposure, so the guard should cover the sample seed path too.

Acceptance criteria:
- `createProject` rejects an id that already exists with a descriptive error, matching the duplicate guards in the other services
- the guard is covered by a service test (including the sample-project seeded case)
- the dashboard-facing create path surfaces the error rather than overwriting

Verification:
- npm run verify passes (typecheck, tests, lint, format)

## TASK-024 — Benchmark report emission as a hard contract

Status: DONE

Goal:
Make `npm run benchmark` fail when it cannot emit `benchmark/results.txt`, matching the CI artifact contract.

Prerequisites:
None.

Context:
The benchmark suite wraps the report write in a try/catch that only warns, so `npm run benchmark` can pass locally without producing `results.txt`. CI treats the artifact as mandatory (`if-no-files-found: error` on the `benchmark-results` upload), so the failure surfaces late and confusingly. Review finding: local-pass/CI-fail mismatch. The warn-only catch was meant to avoid hiding correctness failures; the fix is to fail the suite on write failure instead.

Acceptance criteria:
- a `writeResultsFile` failure fails the benchmark suite rather than passing with a warning
- the hard contract is covered by a test (simulate a write failure and assert failure/no-silent-pass)
- `npm run benchmark` still prints the table and writes the report on success

Verification:
- npm run benchmark passes and produces `benchmark/results.txt`
- npm run verify passes (typecheck, tests, lint, format)

## TASK-025 — Simulator blocked-task and risk deltas

Status: DONE

Goal:
Return the two PROJECT_PLAN-section-10 simulator deltas that are currently missing: blocked-task count and risk indicators.

Prerequisites:
None.

Context:
PROJECT_PLAN §10 lists "blocked-task count" and "risk indicators" among the deltas the simulator should report. `SimulationResult` exposes duration/critical-path/recommendation/value-removed deltas and affected-downstream ids but neither blocked-task count nor any risk indicator, and ADR-009 records no decision to drop them. Review finding. Define the two metrics deterministically before implementing; do not introduce dates or probabilistic analysis.

Suggested deterministic definitions (candidate — confirm in ADR-009 before implementation):
- blocked-task count: number of non-DONE tasks whose prerequisites are not all DONE (in baseline and projected), reported per side and as a delta
- risk indicators: at least one deterministic signal, e.g. number of tasks whose slack fell to zero, or counting newly-critical tasks between sides; document whichever is chosen

Acceptance criteria:
- baseline and projected sides expose blocked-task count; a delta (or enumerated change) is reported
- at least one deterministic risk indicator is defined in ADR-009 and returned; the definition is documented before/with implementation
- both are covered by simulation tests (construction of a blocked case and a changed-slack case)
- existing simulation behavior and output shape remain backward compatible (new fields only)

Verification:
- npm run verify passes (typecheck, tests, lint, format)
- ADR-009 records the chosen definitions

## TASK-026 — Documentation cleanup

Status: DONE

Goal:
Remove residual contradictions between repo docs and the implemented code.

Prerequisites:
None.

Context:
Review findings on documentation accuracy:

- `docs/task-006-review.md` reads as a live defect report but documents issues fixed in the same PR that added it (it asserts element-level freezing is not applied and "all 125 tests pass"; the suite is now 287). Mark it historical/archived or delete it.
- `docs/tasks.md` TASK-015 verification says "286 tests"; actual is 287.
- `docs/handoff.md` freezes "31 engine tests" (actual 34) and "ADR-001 through ADR-010" (the file holds 12 ADRs).
- `isReachable(t, t)` returns false for acyclic graphs (self-reachability convention per ADR-005); this deserves one documenting line in the graph section.
- ADR-006's "O(V+E) per pass" claim is true only per pass; the function is dominated by the topological sort (ready queue is `.sort()`ed at each insertion). Narrow the wording.
- TASK-014's literal "same input produces same time-ordered results" determinism criterion is unsatisfiable for wall-clock timings; ADR-011's domain-result reinterpretation should be pointed to from the task text.
- `.gitignore` contains `.next/` for a framework this repo never uses.

Acceptance criteria:
- `docs/task-006-review.md` is marked historical/superseded (or removed), and nothing in the repo reads it as current
- the stale counts in `docs/tasks.md` and `docs/handoff.md` are corrected
- one-line notes added for the `isReachable` convention, the schedule complexity claim, and the TASK-014 determinism reading
- the `.next/` ignore entry is removed

Verification:
- grep confirms no live references treat `task-006-review.md` as current
- npm run verify still passes (docs-only task, but run the gate)
