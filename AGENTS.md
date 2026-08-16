# Trajectory Repository Instructions

## Mission

This repository contains Trajectory, an explainable project-planning and decision-support portfolio project.

Read `PROJECT_PLAN.md` before making substantive implementation decisions.

## Source of Truth

The repository is the persistent project memory.

Important files:

- `PROJECT_PLAN.md` — product and engineering specification
- `docs/tasks.md` — task backlog and task state
- `docs/handoff.md` — current continuation state
- `docs/progress.md` — append-only historical progress
- `docs/decisions.md` — architectural/domain decisions
- `docs/architecture.md` — current architecture

Do not rely on previous chat history when repository state can answer a question.

## Engineering Principles

1. Prefer simple, defensible designs.
2. Do not add technologies for resume keywords.
3. Keep domain logic framework-independent.
4. Prefer deterministic behavior for core decision logic.
5. Do not fabricate benchmarks or performance claims.
6. Write tests for meaningful behavior and invariants.
7. Avoid unrelated refactors.
8. Keep changes bounded to the active task.
9. Document important architectural tradeoffs.
10. Ask for human approval when the project plan requires it.

## Agent Workflow

Before implementation:

1. Read `PROJECT_PLAN.md`.
2. Read `docs/handoff.md`.
3. Read the active task in `docs/tasks.md`.
4. Inspect relevant architecture and decisions.
5. Verify prerequisites.

After implementation:

1. Run focused tests.
2. Run the broader verification required by the task.
3. Inspect the diff.
4. Update relevant documentation.
5. Update `docs/handoff.md`.
6. Append meaningful information to `docs/progress.md`.
7. Commit only when the task is ready.

## Architectural Boundaries

Domain code must not import:

- React
- Next.js
- browser APIs
- localStorage
- UI components

Infrastructure may implement repository interfaces.

UI should access application/domain behavior through defined application boundaries rather than directly manipulating persistence.

## Human Approval

Stop and request approval before:

- changing core architecture
- adding major dependencies
- changing persistence format
- changing domain invariants
- substantially changing the decision model
- introducing backend infrastructure
- removing or weakening tests
- changing deployment strategy

## Quality Bar

Do not declare a task complete because the code compiles.

Completion requires satisfying the task acceptance criteria, appropriate verification, and a clean explanation of important tradeoffs.
