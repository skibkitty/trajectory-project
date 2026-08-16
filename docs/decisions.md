# Architecture and Domain Decisions

This file is append-oriented. Significant decisions should record the context, alternatives, decision, and consequences.

## ADR-001 — Deterministic Core Decision Engine

### Status
Accepted

### Context
The project's primary differentiator is explainable next-task recommendation.

### Decision
The recommendation engine will be deterministic and independent of any LLM.

### Consequences
- Recommendations can be reproduced.
- Algorithmic behavior can be unit tested.
- Explanations can cite actual computed factors.
- An LLM, if added later, can explain established results rather than determine project state.

## ADR-002 — Domain Independence

### Status
Accepted

### Decision
Core business logic must not depend on React, Next.js, browser APIs, or persistence.

### Consequences
- Algorithms are easier to test.
- The decision engine can run outside the browser.
- UI technology can change without rewriting domain logic.

## ADR-003 — Local-First Persistence

### Status
Accepted provisionally

### Decision
The first implementation will use local persistence behind a repository interface.

### Consequences
- No backend infrastructure is required for MVP.
- Persistence can later be replaced if evidence justifies it.
- Stored data must be versioned.

## ADR-004 — Additive Initial Scoring Model

### Status
Proposed

### Decision
Begin experimentation with an additive score rather than the multiplicative formula from the original concept.

### Rationale
An additive model makes individual factor contributions easier to explain, test, tune, and inspect.

### Important
Weights are not finalized. They must be validated through domain examples and tests before being treated as stable.

## Pending Decisions

- final product name
- exact score weights
- exact scheduling/calendar semantics
- date/time representation
- whether all proposed scenario types belong in MVP
- final UI stack
- benchmark methodology
