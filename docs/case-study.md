# Trajectory — Architecture Case Study

## Overview

Trajectory is an explainable project-planning and decision-support application for a solo developer. Given the current state of a software project — its tasks, dependencies, effort estimates, values, and deadlines — Trajectory answers:

> What task should I work on next, and why?

The system is a portfolio project demonstrating deterministic decision-making, dependency-graph analysis, critical-path scheduling, structured explainability, scenario simulation, and rigorous testing — all in a single-page React application with local persistence.

The key design constraint is **determinism over magic**: every recommendation is fully reproducible, every explanation is backed by computed factors, and every scenario comparison is derived from immutable projections.

---

## 1. The Core Problem

Project planning tools typically fall into two categories: heavyweight systems (Jira, Asana) that require teams and workflows, or lightweight to-do lists that ignore dependencies and critical paths. Neither answers the question a solo developer actually faces:

> "I have 12 tasks I could work on right now. Which one should I pick?"

This question requires reasoning about task value, urgency, effort, confidence, dependency structure, critical-path influence, and downstream impact — simultaneously. Trajectory decomposes this multi-factor judgment into a transparent, additive scoring model where every factor's contribution is individually inspectable.

---

## 2. Domain Model

### 2.1 Entities

The domain contains five core entities:

**Project** — a named container with tasks and goals.

**Task** — the central entity, carrying: `id`, `title`, `description`, `status` (BACKLOG, TODO, IN_PROGRESS, BLOCKED, DONE), `value`, `urgency`, `estimatedEffort`, `confidence` (0–1), `goalId` (optional), and `dependencies` (list of prerequisite task ids).

**Goal** — a named objective that tasks can reference.

**DependencyGraph** — a directed graph constructed from task dependency arrays.

**ScheduleResult** — the output of critical-path analysis: per-task earliest/latest start and finish times, slack, and the critical path.

All domain entities are immutable value objects created by factory functions that enforce invariants (non-empty id/title, non-negative value/urgency, positive effort, bounded confidence, no self-dependency).

### 2.2 Task Status Model

```
BACKLOG → TODO → IN_PROGRESS → DONE
              ↘ BLOCKED ↗
```

The BLOCKED status is informational — it does not affect eligibility. A BLOCKED task whose prerequisites are all DONE remains eligible for recommendation. This is a deliberate design choice: the decision engine computes blocking from the dependency graph, not from a status flag, because the graph is the authoritative source of truth.

### 2.3 Dependency Direction

Edges point from prerequisite to dependent: if task B depends on task A, the edge is A → B. `getPrerequisites(B)` returns [A]; `getDependents(A)` returns [B]. This direction aligns with the forward-pass scheduling semantics where time flows from prerequisites to dependents.

---

## 3. Dependency Graph

The dependency graph (`src/domain/graph/dependency-graph.ts`) is constructed from the task array by `createDependencyGraph(tasks)`. It provides:

- **Direct lookup**: `getPrerequisites(id)` and `getDependents(id)` — O(1) via pre-built adjacency maps
- **Transitive traversal**: `getAllPrerequisites(id)` and `getAllDependents(id)` — BFS, returning sorted results
- **Reachability**: `isReachable(from, to)` — BFS with short-circuit
- **Cycle detection**: `hasCycle()` and `getCyclicTaskIds()` — checks self-reachability for each node (BFS from a node back to itself), which yields precisely the tasks on cycles, excluding tasks merely downstream
- **Topological ordering**: Kahn's algorithm with a lexicographically sorted ready queue — deterministic, independent of input ordering

Construction validates: unique task ids, no references to unknown tasks, and deduplicates repeated dependency entries. Cycles are representable in the graph (they can be detected and reported) but cause `topologicalOrder()` to throw, which propagates through scheduling and the decision engine.

**Why Kahn's algorithm**: the topological order is consumed by both the scheduler (forward/backward pass) and the decision engine (for normalization). A stable, deterministic order ensures that identical project states always produce identical recommendations, regardless of the order tasks were added to the project.

---

## 4. Scheduling and Critical Path

The scheduler (`src/domain/scheduling/schedule.ts`) implements the Critical Path Method (CPM) in two passes over the topological order.

**Forward pass** — compute earliest start (ES) and earliest finish (EF):
```
ES(t) = max(EF(p) for p in prerequisites), or 0 if no prerequisites
EF(t) = ES(t) + duration(t)
```

**Backward pass** — compute latest finish (LF) and latest start (LS):
```
LF(t) = min(LS(d) for d in dependents), or projectDuration if no dependents
LS(t) = LF(t) - duration(t)
```

**Slack** = LS - ES. A task with zero slack is on the **critical path** — any delay to it delays the entire project.

**Project duration** = max(EF) across all tasks.

The duration model is simple: `duration = estimatedEffort`. No calendar dates, resource constraints, or variable durations — keeping the scheduling model deterministic and testable. Fractional effort values (e.g., 1.5 days) are supported.

Each CPM pass is O(V + E): the forward and backward passes are simple linear sweeps over the topological order, reading pre-built adjacency lists. (Note that producing that topological order itself carries additional queue-maintenance and sorting cost — see the dependency-graph section — so the total cost of `calculateSchedule` is dominated by the topological sort it invokes.) Multiple critical paths are possible and all are reported.

---

## 5. Decision Engine

The decision engine (`src/domain/decision/engine.ts`) answers: "Which eligible task should be worked on next?"

### 5.1 Eligibility

A task is eligible if:
1. Its status is not DONE
2. Every prerequisite exists and is DONE

Blocking is derived from the dependency graph, not the BLOCKED status flag.

### 5.2 Scoring Model

The score is an additive sum of weighted, normalized factor contributions:

```
score = Σ (weight × normalized)  [negative-direction factors contribute negatively]
```

**Default factors** (all weight = 1):

| Factor | Direction | Computation |
|--------|-----------|-------------|
| Value | positive | task.value / maxValue |
| Urgency | positive | task.urgency / maxUrgency |
| Dependency impact | positive | directDependentCount / maxDependents |
| Critical path | positive | 1 if on critical path, else 0 |
| Confidence | positive | task.confidence (already 0–1) |
| Effort penalty | negative | task.effort / maxEffort |

**Normalization**: value, urgency, effort, and dependent counts are divided by the maximum of that metric across the full task set. If the maximum is 0, the normalized contribution is 0 (no division by zero). Confidence is already bounded [0, 1] and used directly.

**Rounding**: scores are rounded to three decimal places for display consistency.

**Tie-breaking**: descending score, then ascending task id (`localeCompare`). Fully deterministic and independent of input ordering.

### 5.3 Composability

Factors implement a `ScoringFactor` interface:

```typescript
interface ScoringFactor {
  id: string;
  label: string;
  direction: "positive" | "negative";
  weight: number;
  compute(context: ScoringContext): FactorComputation;
}
```

The default factor set is frozen but can be reordered, reweighted, subsetted, or extended by callers without modifying the engine. This enables weight experimentation without touching core logic.

### 5.4 Selection Policy

Evaluation and selection are separated. `evaluateTasks` ranks all candidates deterministically. Selection always takes the highest-ranked candidate. `selectedTaskId` is null when no candidates exist. A future weighted-random selection policy can layer on top without altering the ranking — a deliberate design for future exploration of stochastic scheduling strategies.

---

## 6. Recommendation Explainability

The explainability layer (`src/domain/decision/recommendation.ts`) wraps the engine and produces structured reasoning:

```typescript
interface Recommendation {
  taskId: string | null;
  score: number | null;
  factors: EvaluationFactor[];   // per-factor contribution breakdown
  assumptions: Assumption[];     // model semantics
  warnings: RecommendationWarning[];  // edge cases
}
```

### 6.1 Factors

Each factor carries: stable id, human label, signed contribution, direction, source metric string (e.g., "value: 8"), and a human-readable explanation. The same `EvaluationFactor` type is used across evaluation and explanation — one shared representation, not duplicated shapes.

### 6.2 Assumptions

Always-present statements describing model semantics: additive model, normalization maxima (with actual values as detail), confidence bounded [0,1], CPM-derived critical path, tie-break policy, provisional weights. These are constant for a given input and independent of input ordering.

### 6.3 Warnings

Emitted in a fixed order when conditions hold:

1. `no-eligible-tasks` — no candidates exist (empty recommendation state)
2. `tie-break-applied` — multiple candidates tied at the top score; affected task ids listed
3. `zero-maximum-normalization` — all tasks share the same value/urgency/effort/dependent-count, making that factor contribute nothing
4. `blocked-status-eligible` — tasks marked BLOCKED satisfy eligibility and remain under consideration

Warnings are conditional and ordered, so the UI can render them predictably.

---

## 7. Scenario Simulation

The simulator (`src/domain/simulation/simulation.ts`) enables what-if analysis without mutating the baseline project.

### 7.1 Scenario Types

- **delay-task**: adds positive effort to a task's duration
- **change-effort**: replaces a task's effort with a new value
- **remove-task**: removes a task and strips its dependency references from survivors

A fourth type (deadline change) is deferred until a date model exists.

### 7.2 Derivation Over Mutation

`applyScenario` returns a new task array. Only the targeted task is rebuilt via `createTask`; untouched tasks keep object identity (`===`). For `remove-task`, surviving tasks keep identity unless they referenced the removed task, in which case the dependency entry is stripped — de-scoping must leave a constructible graph.

### 7.3 Reuse of Domain Layers

`simulateScenario` builds baseline and projected state through the existing `createDependencyGraph`, `calculateSchedule`, and `recommendNextTask` functions. No scheduling or scoring logic is duplicated. Scenarios automatically inherit CPM semantics and the deterministic engine, including custom factor-set pass-through.

### 7.4 Comparison Output

Each side (baseline, projected) exposes: `projectDuration`, `criticalPath`, `recommendedTaskId`, `recommendedScore`. Deltas: `durationDelta`, `criticalPathChanged`, `recommendationChanged`, and `valueRemoved` (for de-scope only).

**Affected downstream**: the target plus its transitive dependents, filtered to tasks whose `[earliestStart, earliestFinish]` window actually changed. Merely being downstream of the change is not enough — slack absorbs some changes.

---

## 8. Architecture and Layering

```
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

### 8.1 Domain

Framework-independent business rules: project state, task state, dependency graph, candidate eligibility, critical-path analysis, deterministic decision engine, explanation factors, scenario simulation. Must not import React, Next.js, browser APIs, or persistence.

### 8.2 Application

Coordinates use cases: CRUD for projects/tasks/goals/dependencies, recommendation, scenario simulation. Services depend on the `ProjectRepository` interface, not concrete implementations. Dependency injection via constructor parameters.

### 8.3 Infrastructure

Concrete implementations: `LocalProjectRepository` (backed by `StorageProvider`), versioned serialization (`ProjectData` with `schemaVersion`), schema validation on deserialization, corrupted-data handling.

### 8.4 UI

React components: Dashboard, ProjectSelector, RecommendationPanel, FactorBreakdown, WarningsPanel, TaskList, TaskForm, ProjectForm, DependencyEditor, DependencyGraph (SVG), ScenarioPanel. The UI accesses domain logic through application services, not by manipulating persistence directly.

---

## 9. Persistence

Local-first persistence behind a repository abstraction:

- **`ProjectRepository`** interface: `save`, `load`, `list`, `delete` (all async for future backend compatibility)
- **`StorageProvider`** interface: abstracts key-value storage (localStorage, Node fs, in-memory)
- **`LocalProjectRepository`**: concrete implementation using `StorageProvider` with prefixed keys (`trajectory:project:{id}`)
- **Serialization**: versioned format (`schemaVersion: 1`), field validation, fallback to domain defaults for missing optional fields
- **Corrupted data**: `list()` skips broken entries; `load()` propagates errors
- **Project summaries**: `list()` returns lightweight summaries (id, name, task/goal counts) without deserializing full graphs

---

## 10. Testing Strategy

### 10.1 Test Suites

| Suite | Location | Runner | Scope |
|-------|----------|--------|-------|
| Unit/Component/Integration | `src/**` | `vitest run` | Domain algorithms, application services, UI components, integration workflows |
| E2E | `e2e/` | `playwright test` | Browser-level user journeys against real persistence |
| Benchmarks | `benchmark/` | `vitest run --config vitest.benchmark.config.ts` | Wall-clock timing of domain algorithms |

### 10.2 Coverage Highlights

- **287 correctness/component/integration tests** across 30 files
- **2 Playwright E2E specs** covering the primary user journey and sample-project demo
- **6 benchmark tests** covering determinism, dataset validity, and harness output

### 10.3 Domain Algorithm Tests

- Graph: cycle detection, topological ordering, traversal, edge cases (empty, single-node, self-dependency, large chains)
- Scheduling: forward/backward pass, multiple critical paths, fractional effort, determinism, immutability
- Decision engine: eligibility, per-factor monotonicity, tie-breaks, normalization boundaries, custom factors, input-order independence
- Recommendation: factor ids, exposed maxima, assumptions, warnings, empty states, JSON-equality across repeated/reordered runs
- Simulation: baseline isolation, delay/effort/removal behavior, affected-downstream filtering, determinism, immutability

### 10.4 Integration Tests

Two integration test suites drive all six application services against a real `LocalProjectRepository` (in-memory `StorageProvider` that round-trips through actual serialization). This crosses application + domain + infrastructure boundaries rather than stubbing the repository. The primary workflow is covered end-to-end: create project → add goals/tasks → add dependencies → recommendation + factor inspection → run scenario → compare result.

### 10.5 E2E Tests

Two Playwright specs exercise real browser behavior against the real persistence/app layer stack:

- **Primary journey**: create project → add tasks → add dependencies → view recommendation → inspect factors → run delay scenario → compare → de-scope → verify baseline unchanged
- **Sample project**: seeds realistic data and asserts the deterministic recommendation, factor breakdown, dependency graph with critical-path marking, and legend

---

## 11. Measured Performance

Benchmarks run against deterministic datasets (100, 1,000, 5,000, and 10,000 tasks) via `npm run benchmark`. All timings are wall-clock milliseconds; the methodology is best-of-N iterations using `process.hrtime.bigint()`. Iteration counts step down as dataset size rises (50 for ≤100 tasks, 20 for ≤1000, 5 for ≤5000, 2 for 10,000) to keep total wall-clock time tolerable. Both mean and minimum are recorded so stability is visible.

**Machine context** (where `npm run benchmark` last produced `benchmark/results.txt`): the benchmark was run on a Windows 11 machine with Node.js 24 (node 24.19.0, npm 11.17.0). The exact CPU/OS combination is not captured by the harness; timings are intentionally treated as machine-dependent relative signals, not cross-machine claims. Reproduce locally for a current measurement on your own hardware.

| Operation | 100 tasks (ms) | 1,000 tasks (ms) | 5,000 tasks (ms) | 10,000 tasks (ms) |
|-----------|---------------|-------------------|-------------------|--------------------|
| Graph construction | 0.05 | 1.11 | 4.74 | 10.86 |
| Topological order | 0.10 | 7.26 | 162.06 | 799.31 |
| Cycle detection | 0.11 | 0.98 | 7.17 | 21.91 |
| Prerequisite lookup | 0.00 | 0.00 | 0.00 | 0.00 |
| Dependent lookup | 0.00 | 0.00 | 0.00 | 0.00 |
| Transitive dependents | 0.03 | 0.04 | 0.36 | 0.12 |
| Transitive prerequisites | 0.00 | 0.00 | 0.00 | 0.02 |
| Reachability | 0.10 | 1.22 | 8.39 | 24.36 |
| Critical path | 0.18 | 7.59 | 204.69 | 823.91 |
| Decision scoring | 0.16 | 1.64 | 14.66 | 21.50 |
| Recommendation | 0.17 | 1.52 | 15.06 | 21.86 |
| Scenario simulation | 1.16 | 23.50 | 461.50 | 1,647.08 |

*Table: mean wall-clock milliseconds from the benchmark suite (generated by `npm run benchmark` on the recorded run; full results including min times and iteration counts are written to the git-ignored `benchmark/results.txt`, reproduced locally and uploaded as a CI artifact).*

### 11.1 Key Observations

- **Graph construction** and **lookup operations** are sub-millisecond for practical project sizes (<1,000 tasks).
- **Topological ordering** and **critical-path analysis** are the heaviest graph operations in practice. The CPM passes themselves are linear, but Kahn's algorithm's ready queue is implemented as an array that is re-sorted as nodes are added, so total ordering cost grows superlinearly — which the benchmark data reflects (7.26 ms at 1,000 tasks → 799.31 ms at 10,000 tasks). The benchmark table shows the same pattern for critical-path analysis because `calculateSchedule` invokes the topological order internally.
- **Decision scoring** and **recommendation** scale nearly linearly with the number of eligible candidates.
- **Scenario simulation** is the most expensive operation because it recomputes the full pipeline (graph → schedule → recommendation) for the projected state. At 10,000 tasks it takes ~1.6 seconds in the benchmark environment — likely acceptable for occasional interactive what-if operations, but it is a candidate for future optimization.
- The benchmark datasets and all algorithm outputs are deterministic: a given seed always yields the identical task set, and identical inputs always produce identical topological orderings, schedules, scores, and recommendations — verified by the benchmark test suite. Wall-clock timings, by contrast, naturally vary between runs and are reported as machine-dependent measurements rather than exact figures.

---

## 12. CI/CD and Quality Gates

Every push/PR to main triggers a GitHub Actions workflow with four independent jobs:

1. **verify**: typecheck, unit/component/integration tests, lint, format check (`npm run verify`)
2. **benchmark**: runs `npm run benchmark` and uploads `benchmark/results.txt` as a CI artifact
3. **build**: production Vite build
4. **e2e**: installs Chromium, runs Playwright specs, uploads HTML report on failure

A workflow-level concurrency group with `cancel-in-progress: true` ensures only the latest commit's run proceeds per PR. The four CI jobs run on every push/PR and their results are visible as status checks. Enforcing those checks as required before merge (via GitHub branch-protection rules on main) is a repository-settings action that remains to be configured by the repository owner; the workflow itself defines and runs the checks but cannot require them.

Because several documents independently describe project state, the repository treats documentation consistency as a review concern: every "implemented" claim maps to code or configuration, every "accepted" decision is removed from the pending-decisions list, every "future" or "human action" item remains explicitly marked as such, and benchmark figures trace to the `npm run benchmark` output. The current handoff and decision records are the authoritative statement of that state.

---

## 13. Design Decisions and Tradeoffs

### 13.1 Deterministic Over Probabilistic

The decision engine is fully deterministic. Given identical inputs, it always produces the same recommendation. This is a portfolio choice: determinism makes the system testable, reproducible, and explainable. A future weighted-random selection policy is designed to layer on top without replacing the deterministic ranking.

### 13.2 Additive Over Multiplicative Scoring

An additive model makes individual factor contributions easier to explain and test. A multiplicative model (the original concept) would compound factors in ways that are harder to attribute and debug. The additive model was chosen for MVP; weights remain provisional and are validated by invariant tests, not claimed optimal.

### 13.3 Domain Independence

The domain layer has zero framework dependencies — no React, no browser APIs, no persistence. This means the decision engine can run in a Node.js test, a browser, or a serverless function without changes. It also means the UI can be replaced without rewriting any business logic.

### 13.4 Derivation Over Mutation in Scenarios

Scenarios produce new task arrays rather than mutating existing ones. Untouched tasks keep object identity. This makes baseline isolation trivial to verify (=== equality) and prevents accidental state corruption.

### 13.5 Local-First Persistence

No backend infrastructure is required for MVP. The repository abstraction means persistence can be swapped (filesystem, network, database) without changing domain or application code. Schema versioning provides a foundation for future migrations.

### 13.6 No Unnecessary Dependencies

The graph algorithms, scheduling, and scoring are all hand-rolled. No graph library, no scheduling library, no math library. This keeps the dependency tree small, the code transparent, and the algorithms independently testable.

---

## 14. What's Next

The following remain under human review and are not yet implemented:

- Exact decision-engine weights (currently all 1)
- Calendar-based scheduling (dates, deadlines, working days)
- Deadline-change scenario type (deferred until a date model exists)
- Weighted-random selection policy (requires explicit `RandomSource` abstraction for testability)
- Cross-browser E2E (Chromium-only for MVP; WebKit/Firefox pending evidence of a real defect)

Project naming and availability are resolved in [ADR-013](./decisions.md): the product is Trajectory, hosted as source on GitHub (`skibkitty/trajectory-project`), with no deployment target for MVP.

---

## 15. Running the Project

```bash
npm install
npm run dev          # Start the development server
npm run verify       # Typecheck + test + lint + format
npm run build        # Production build
npm run benchmark    # Algorithm benchmarks (separate from test suite)
npm run test:e2e     # Playwright browser tests (requires: npx playwright install chromium)
```

---

## 16. Repository Structure

```
trajectory-project/
├── src/
│   ├── domain/           # Framework-independent business rules
│   │   ├── project.ts    # Project entity
│   │   ├── task.ts       # Task entity + factory
│   │   ├── task-status.ts # TaskStatus enum
│   │   ├── goal.ts       # Goal entity
│   │   ├── graph/        # Dependency graph (construction, traversal, cycles, topological order)
│   │   ├── scheduling/   # Critical Path Method (forward/backward pass, slack, critical path)
│   │   ├── decision/     # Decision engine (scoring, factors) + explainability
│   │   └── simulation/   # Scenario simulation (delay, effort change, removal)
│   ├── application/      # Use-case services + repository interface
│   ├── infrastructure/   # Local persistence, serialization, storage abstraction
│   └── ui/               # React components, styles, graph layout
├── e2e/                  # Playwright browser tests
├── benchmark/            # Algorithm benchmarks (deterministic datasets, timing harness)
├── docs/                 # Architecture, decisions, tasks, progress, handoff, case study
└── .github/workflows/    # CI/CD (verify, benchmark, build, e2e)
```
