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
Accepted (implemented in TASK-005; see ADR-007 for the concrete model)

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

## ADR-007 — Candidate Eligibility, Scoring Model, and Tie-Breaking

### Status
Accepted

### Context
TASK-005 requires recommending the best eligible next task with deterministic scoring, documented tie-breaking, and a structured factor breakdown. ADR-004 proposed an additive model; this record specifies the concrete model implemented in `src/domain/decision/engine.ts`.

### Decision

- **Eligibility**: a task is a candidate iff its status is not `DONE` and every prerequisite exists and is `DONE`. Blocking is derived from prerequisites, not from the `BLOCKED` status flag — a `BLOCKED` or `IN_PROGRESS` task with satisfied prerequisites remains eligible.
- **Model**: additive, per ADR-004. `score = Σ (weight × normalized)` where negative-direction factors contribute negatively.
- **Default factors** (all weights 1): value, urgency, dependency impact (direct dependent count), critical-path membership (binary), confidence, effort penalty (negative).
- **Normalization**: value, urgency, effort, and dependents are divided by the maximum of that metric across the task set passed to `evaluateTasks`. Confidence is already bounded [0, 1] and used directly. If a maximum is 0, the normalized contribution is 0 (no division by zero).
- **Rounding**: scores are rounded to three decimal places.
- **Tie-breaking**: descending score, then ascending task id (`localeCompare`). Fully deterministic and independent of input ordering.
- **Selection policy**: evaluation and selection are separated per PROJECT_PLAN §6. `evaluateTasks` ranks all candidates; selection always takes the highest-ranked candidate. `selectedTaskId` is null when there are no candidates. A weighted-random selection policy, if introduced later, must layer on top without altering this ranking.
- **Composability**: factors implement a `ScoringFactor` interface (`id`, `label`, `direction`, `weight`, `compute`). `DEFAULT_FACTORS` is frozen; callers may reorder, reweight, subset, or extend factors without modifying the engine.
- **Output**: each candidate carries a frozen array of factors with label, signed contribution, direction, source metric, and explanation. Results are frozen.

### Alternatives considered
- Multiplicative scoring (original concept): rejected for MVP per ADR-004 — harder to attribute and explain individual contributions.
- Rank-based (Borda-style) scoring: rejected because it discards metric magnitudes and complicates factor-level explanations.

### Consequences
- Ranking is reproducible for identical inputs and independent of task input order (covered by tests).
- Per-factor monotonicity and boundary conditions (zero maxima, ties, empty sets) are unit tested.
- New factors require no engine changes, enabling weight experimentation without touching core logic.
- Weights remain provisional (see ADR-004); they are validated by invariant tests, not claimed optimal.
- Because normalization uses the maximum of the passed-in task set, callers should pass the full project so scores remain anchored as tasks complete; passing partial subsets yields pool-relative scores instead.
- Rounding to three decimals can create ties at the displayed precision; the documented tie-breaking policy resolves them deterministically.
