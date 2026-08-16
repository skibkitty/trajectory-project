# Architecture

## Current Status

Phase 1 — Domain foundation. Project, Task, Goal entities and invariants implemented. This document records the intended architecture and is expected to evolve through documented decisions.

## Dependency Direction

```text
UI
 ↓
Application
 ↓
Domain

Application
 ↓
Repository Interfaces
 ↓
Infrastructure
```

## Domain

The domain contains framework-independent business rules:

- project state
- task state
- dependency graph
- candidate eligibility
- critical-path analysis
- deterministic decision engine
- explanation factors
- scenario simulation

The domain must not import React, Next.js, browser APIs, or persistence implementations.

## Application

The application layer coordinates use cases such as:

- create/update project
- create/update task
- add dependency
- calculate recommendation
- explain recommendation
- simulate scenario
- compare scenario to baseline

Application services may depend on repository interfaces.

## Infrastructure

Infrastructure owns concrete implementations for:

- persistence
- browser storage
- serialization/deserialization
- schema migration
- external integrations if ever justified

## UI

The UI is responsible for:

- rendering
- interaction
- accessibility
- visual explanation
- routing/navigation

It should not directly manipulate local persistence.

## Initial Package Direction

```text
src/
├── domain/
│   ├── project/
│   ├── task/
│   ├── graph/
│   ├── scheduling/
│   ├── decision/
│   └── simulation/
├── application/
├── infrastructure/
└── ui/
```

This is a starting boundary, not a requirement to create every directory immediately.

## Architecture Rules

- Introduce abstractions when they protect a real boundary.
- Avoid speculative repositories/services/factories.
- Keep algorithms independently testable.
- Prefer immutable derived scenario state where practical.
- Record significant changes in `docs/decisions.md`.
