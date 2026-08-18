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

## ADR-005 — Dependency Graph Design

### Status
Accepted

### Context
TASK-003 requires representing task dependencies as a directed graph with prerequisite lookup, dependent lookup, traversal, cycle detection, and deterministic topological ordering.

### Decision
- **Edge direction**: an edge points from a prerequisite task to a dependent task. `getPrerequisites(t)` returns incoming neighbors; `getDependents(t)` returns outgoing neighbors.
- **Construction validation**: duplicate task ids and dependency references to unknown tasks are rejected. Repeated dependency entries are deduplicated.
- **Deterministic ordering**: all lookup and traversal results are returned sorted lexicographically. Topological ordering uses Kahn's algorithm with a lexicographically sorted ready queue, so output is independent of the order tasks are passed in.
- **Cycle detection**: a task is cyclic if it can reach itself through at least one edge (self-reachability). This yields the precise set of tasks on cycles, excluding tasks merely downstream of a cycle. Topological ordering throws and names the cyclic tasks when a cycle exists.
- **Representation**: a `DependencyGraph` interface created by a `createDependencyGraph(tasks)` factory, consistent with the existing domain style. No graph library is used, per the project plan's preference for avoiding unnecessary dependencies.

### Consequences
- Traversal and ordering are fully deterministic and reproducible for identical task sets regardless of input ordering.
- Cycles are representable in the graph so they can be analyzed and reported; the application layer decides whether to reject them.
- Repeated single-node BFS/DFS is sufficient for MVP; performance benchmarking is deferred to TASK-014.

## Pending Decisions

- final product name
- exact score weights
- exact scheduling/calendar semantics
- date/time representation
- whether all proposed scenario types belong in MVP
- final UI stack
- benchmark methodology

## ADR-006 — Scheduling and Critical Path Semantics

### Status
Accepted

### Context
TASK-004 requires calculating deterministic scheduling information from task durations and dependencies, including critical-path identification.

### Decision
- **Duration model**: task duration equals `estimatedEffort`. No calendar dates, resource constraints, or variable durations for MVP.
- **Algorithm**: standard Critical Path Method (CPM) with forward and backward pass over the topological order.
- **Forward pass**: `earliestStart(t) = max(earliestFinish(p) for p in prerequisites)`, or 0 if no prerequisites. `earliestFinish(t) = earliestStart(t) + duration(t)`.
- **Backward pass**: `latestFinish(t) = min(latestStart(d) for d in dependents)`, or `projectDuration` if no dependents. `latestStart(t) = latestFinish(t) - duration(t)`.
- **Slack**: `slack(t) = latestStart(t) - earliestStart(t)`. A task with zero slack is on the critical path.
- **Critical path**: the set of all tasks with zero slack. Multiple critical paths are possible and all are reported.
- **Project duration**: the maximum `earliestFinish` across all tasks.
- **Tie-breaking**: none needed — scheduling is fully deterministic given the topological order.
- **Cycle handling**: the function delegates to `DependencyGraph.topologicalOrder()` which throws on cycles.

### Consequences
- Scheduling is deterministic and reproducible for identical inputs.
- The algorithm runs in O(V + E) time per pass (two passes total).
- No external scheduling library is used.
- The domain remains framework-independent.
- Fractional effort values are supported (e.g., 1.5 days).
- Result arrays are frozen to prevent accidental mutation.
