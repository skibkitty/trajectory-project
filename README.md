# Trajectory

Trajectory is an explainable project-planning and decision-support engine that recommends the best next task from a project's current state.

## Portfolio Focus

The project is designed to demonstrate:

- dependency-graph algorithms
- deterministic decision systems
- critical-path analysis
- explainable scoring
- scenario simulation
- domain/application/infrastructure separation
- rigorous automated testing
- measured performance
- polished product UX
- disciplined agent-driven development

## Repository Guide

- `PROJECT_PLAN.md` — product and engineering specification
- `AGENTS.md` — repository-wide OpenCode instructions
- `docs/tasks.md` — implementation backlog
- `docs/handoff.md` — current continuation state
- `docs/progress.md` — append-only history
- `docs/decisions.md` — architectural/domain decisions
- `docs/architecture.md` — architecture

## Status

Domain core complete (model, dependency graph, scheduling and critical path, decision engine, scenario simulation). Persistence, application services, a React/Vite UI (recommendation dashboard, project/task/dependency editor, graph visualization, scenario comparison), integration coverage, and algorithm benchmarks are implemented and passing.

Core architecture, decision-engine weights, scheduling/calendar semantics, and final product naming remain under human review. Do not treat provisional product decisions as final until they are reviewed.

## Engineering Principle

The deterministic domain engine is the source of truth. Any future AI layer must not arbitrarily determine project state or replace deterministic calculations.
