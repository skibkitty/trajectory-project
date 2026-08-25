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

Status: BACKLOG

Goal:
Connect domain operations to persistence through explicit use cases.

Prerequisites:
TASK-005, TASK-007, TASK-008

## TASK-010 — Build recommendation dashboard

Status: BACKLOG

Goal:
Create the primary product demonstration surface.

Prerequisites:
TASK-009

Acceptance criteria:
- recommendation is immediately visible
- explanation factors are visible
- user can inspect why a task was selected

## TASK-011 — Build dependency visualization

Status: BACKLOG

Goal:
Visually demonstrate graph and critical-path analysis.

Prerequisites:
TASK-010

## TASK-012 — Build scenario comparison

Status: BACKLOG

Goal:
Let the user run and compare a scenario against baseline.

Prerequisites:
TASK-011

## TASK-013 — Add integration and E2E coverage

Status: BACKLOG

Goal:
Protect the primary user workflow.

Prerequisites:
TASK-012

## TASK-014 — Benchmark algorithms

Status: BACKLOG

Goal:
Measure algorithm performance at meaningful graph sizes.

Prerequisites:
TASK-013

## TASK-015 — Accessibility and UX hardening

Status: BACKLOG

Goal:
Make the application polished and demonstrable.

Prerequisites:
TASK-013

## TASK-016 — CI/CD

Status: BACKLOG

Goal:
Automate verification and deployment.

Prerequisites:
TASK-013

## TASK-017 — Architecture case study and final documentation

Status: BACKLOG

Goal:
Document decisions, algorithms, testing, and measured performance for recruiter/interview use.

Prerequisites:
TASK-014, TASK-015, TASK-016
