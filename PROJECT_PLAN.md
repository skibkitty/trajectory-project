# Trajectory — Preliminary Project Plan

## 1. Project Purpose

Trajectory is an explainable project-planning and decision-support application for a solo developer.

Its primary portfolio purpose is to demonstrate strong software engineering judgment through a deterministic decision engine, dependency-graph analysis, explainability, scenario simulation, rigorous testing, and a polished interface.

This is a portfolio project, not a claim that the author has discovered a novel project-management methodology.

## 2. Primary Product Question

> Given the current state of a software project, what task should the developer work on next, and why?

The first optimization target is therefore **best-next-task selection**.

The system must prefer deterministic, inspectable reasoning over opaque AI-generated recommendations.

## 3. Product Scope

### MVP

The MVP must support:

1. Creating a project.
2. Creating tasks.
3. Assigning task metadata:
   - value
   - urgency/deadline pressure
   - estimated effort
   - confidence
   - status
   - goal
4. Defining directed task dependencies.
5. Detecting invalid dependency cycles.
6. Determining which tasks are currently eligible to work on.
7. Computing dependency and downstream impact.
8. Computing critical-path information.
9. Ranking eligible tasks using a deterministic decision model.
10. Producing a structured explanation for each recommendation.
11. Showing the recommendation in a polished UI.
12. Running deterministic "what-if" simulations for selected changes.
13. Comparing baseline and scenario results.
14. Persisting projects locally.
15. Testing domain algorithms independently of React/browser APIs.

### Explicit Non-Goals

The MVP will NOT include:

- team collaboration
- authentication
- billing
- cloud synchronization
- real-time collaboration
- project-management integrations
- calendar integrations
- an autonomous LLM planner
- an LLM-controlled source of truth
- a dedicated backend unless later evidence justifies one
- a graph database
- machine learning
- claims of mathematically optimal project scheduling

These are excluded because they add infrastructure and product breadth without materially improving the core portfolio story.

## 4. Core User

The first user is a solo developer.

The interface should therefore optimize for fast comprehension by one person managing a technically complex project.

## 5. Product Differentiator

The differentiator is not "AI task management."

The differentiator is:

> A transparent decision engine that turns project state into an actionable recommendation and exposes the reasoning behind that recommendation.

A recommendation should be decomposable into meaningful contributions such as:

- downstream tasks unblocked
- critical-path influence
- value
- deadline pressure
- effort
- confidence
- risk/context-switching penalties

Exact weights must be validated through implementation and tests rather than assumed to be objectively correct.

## 6. Decision Engine

### Candidate selection

Only tasks that are:

- not complete
- not blocked by incomplete prerequisites
- valid according to domain invariants

are candidates for recommendation.

### Scoring principle

The initial model should be additive rather than multiplicative.

A candidate conceptual model is:

    score =
      valueContribution
      + urgencyContribution
      + dependencyContribution
      + criticalPathContribution
      + confidenceContribution
      - effortPenalty

This is deliberately a starting model, not a claim that it is optimal.

The implementation must:

- normalize inputs where appropriate
- expose each contribution
- use deterministic arithmetic
- define tie-breaking
- document assumptions
- test monotonicity where meaningful
- test boundary conditions

### Tie-breaking

Tie-breaking must be deterministic. The exact policy should be documented in the domain decision record once implemented.

### Evaluation and selection policy

The decision engine has two distinct responsibilities that must be kept separate:

1. **Evaluation and ranking** — Deterministically compute a score and structured explanation for every eligible candidate task. This is the core of the engine and must remain deterministic, reproducible, and independently testable at all times.

2. **Selection policy** — Choose one task from the ranked candidates to recommend as the "best next task."

The MVP uses a **deterministic selection policy**: always select the highest-ranked candidate, with documented tie-breaking.

A future **weighted selection policy** may be introduced that selects among eligible tasks with probability proportional to their evaluated priority. This policy must:

- be implemented as a separate, clearly identified layer on top of the deterministic evaluation
- never replace or weaken the deterministic ranking
- remain optional — the deterministic policy must always be available as the default
- inject randomness through an explicit abstraction (e.g. a `RandomSource` interface) rather than calling `Math.random()` directly inside domain logic, so that behavior remains testable and reproducible in unit tests
- be documented in `docs/decisions.md` with rationale, tradeoffs, and testing approach before implementation

This separation preserves the portfolio guarantee that the engine's reasoning is inspectable and reproducible while allowing experimentation with exploration strategies.

## 7. Explainability

The decision engine must return structured reasoning, not formatted prose.

Conceptually:

    Recommendation
      task
      score
      factors[]
      assumptions[]
      warnings[]

Each factor should contain enough information for the UI to render:

    label
    contribution
    direction
    source metric
    short explanation

The UI may convert these structured facts into natural language.

An LLM is not required for MVP.

## 8. Dependency Graph

Represent dependencies as a directed graph.

Required capabilities:

- graph construction
- prerequisite lookup
- dependent lookup
- reachability
- downstream impact
- cycle detection
- topological ordering where applicable

The graph layer must be framework-independent.

The implementation should avoid unnecessary graph libraries unless benchmarking or correctness evidence demonstrates a benefit.

## 9. Critical Path

The engine should identify critical or near-critical task chains based on the project's scheduling model.

For MVP, use deterministic task durations and dependency constraints.

The implementation must clearly distinguish:

- critical-path analysis
- general task priority

A task can be high priority without being on the critical path, and vice versa.

## 10. Scenario Simulation

Simulation is a secondary but important differentiator.

MVP scenarios should include:

- delay a task
- change task effort
- remove/de-scope a task
- change a deadline

Each scenario should produce a new derived project state rather than mutate the baseline.

The simulator should report measurable deltas such as:

- projected completion date/duration
- affected downstream tasks
- critical-path changes
- blocked-task count
- risk indicators
- value removed, when applicable

Simulation must be deterministic and independently testable.

## 11. Domain Model

Initial conceptual entities:

- Project
- Goal
- Task
- Dependency
- ProjectSnapshot
- Recommendation
- RecommendationFactor
- Scenario
- ScenarioResult

The implementation should avoid over-modeling. Value objects and additional entities should be introduced only when they clarify invariants or behavior.

## 12. Architecture

Preferred dependency direction:

    UI
      ↓
    Application
      ↓
    Domain

    Application
      ↓
    Repository interfaces
      ↓
    Infrastructure

Domain code must not depend on:

- React
- Next.js
- Redux
- localStorage
- browser APIs

The decision engine, graph algorithms, critical-path logic, and simulator must be usable from a plain TypeScript test environment.

## 13. Technology Selection

Technology is not locked by the original planning document.

The implementation should begin with the smallest justified TypeScript setup.

A framework and UI stack may be introduced when the application layer is ready.

Current working assumption:

- TypeScript
- React/Next.js for the UI
- local persistence
- Vitest for unit/integration tests
- Playwright for browser E2E tests
- GitHub Actions for CI

These are provisional and must not be added solely for resume keywords.

Redux is not required unless a concrete cross-cutting client-state problem emerges.

## 14. Persistence

Initial persistence should be local.

Use a repository abstraction so persistence is replaceable.

The persistence format must be versioned from its first durable implementation.

Schema migrations should be introduced if the stored model changes incompatibly.

## 15. Testing Strategy

Testing should emphasize the parts that demonstrate engineering skill.

### Unit tests

- domain invariants
- graph traversal
- cycle detection
- topological ordering
- critical-path analysis
- scoring
- explanation generation
- simulation

### Property-oriented tests

Use property-based testing where it provides meaningful value, especially for graph invariants and deterministic ranking.

Examples:

- cyclic dependency graphs are rejected
- completed prerequisites cannot become prerequisites again through invalid state
- recommendation output is deterministic for identical inputs

### Integration tests

Test application services against repository interfaces and concrete in-memory/local implementations.

### E2E

Cover the most important user journey:

    create/open project
      → create tasks
      → create dependencies
      → view recommendation
      → inspect explanation
      → run scenario
      → compare result

## 16. Performance

Do not invent performance claims.

Benchmark only after correctness exists.

Initial benchmark datasets should include:

- 100 tasks
- 1,000 tasks
- 5,000 tasks
- 10,000 tasks

Measure only operations that matter:

- graph construction
- cycle detection
- dependency traversal
- critical-path analysis
- ranking
- simulation

Rendering benchmarks should be added only if the UI actually exhibits a measurable problem.

Optimization must follow measurement.

## 17. UX

The UI should emphasize understanding rather than feature count.

Primary views:

1. Recommendation dashboard
2. Project/task editor
3. Dependency graph
4. Recommendation explanation
5. Scenario builder
6. Scenario comparison

The recommendation should be the visual center of the application.

A recruiter should be able to understand the product within roughly one short demonstration:

> "Here is the current project. Trajectory recommends this task. Here are the five reasons. Now I delay another task, and the recommendation/forecast changes."

## 18. Agent-Driven Development

The repository is the source of truth.

Agents must operate in bounded tasks.

Workflow:

    READ
      ↓
    PLAN
      ↓
    CLAIM
      ↓
    IMPLEMENT
      ↓
    VERIFY
      ↓
    REVIEW
      ↓
    FIX
      ↓
    COMMIT
      ↓
    HANDOFF

Builder, tester, reviewer, and orchestrator responsibilities are separated.

Agents must not silently change:

- core architecture
- domain invariants
- persistence format
- scoring model
- deployment strategy

Such changes require a documented proposal and human approval.

## 19. Git History

The project should be developed through genuine incremental work.

Each task should be implemented on a feature branch (`feat/NNN-task-slug`) and merged to `main` after review. This makes the workflow visible and keeps `main` always deployable.

Good commits are bounded and descriptive.

Examples:

- `chore: initialize project control plane`
- `feat(domain): add task value object`
- `feat(graph): implement cycle detection`
- `test(decision): cover ranking tie-breaks`
- `feat(simulation): support task delay scenarios`

Do not fabricate history, timestamps, metrics, or activity.

## 20. Implementation Phases

### Phase 0 — Project control plane
Repository, documentation, OpenCode configuration, agent workflow.

### Phase 1 — Domain foundation
Task/project/goal model and invariants.

### Phase 2 — Dependency graph
Graph representation, traversal, cycle detection, topological ordering.

### Phase 3 — Scheduling analysis
Duration model and critical-path analysis.

### Phase 4 — Decision engine
Candidate selection, deterministic scoring, tie-breaking.

### Phase 5 — Explainability
Structured recommendation factors and assumptions.

### Phase 6 — Scenario engine
Immutable scenarios and deterministic result comparison.

### Phase 7 — Persistence
Repository abstraction, local implementation, schema versioning.

### Phase 8 — Application layer
Use cases connecting domain logic to persistence.

### Phase 9 — UI foundation
Application shell and project data flow.

### Phase 10 — Recommendation experience
Dashboard and explanation panel.

### Phase 11 — Graph experience
Dependency and critical-path visualization.

### Phase 12 — Scenario experience
Scenario builder and comparison UI.

### Phase 13 — Testing hardening
Integration, E2E, edge cases, regression coverage.

### Phase 14 — Performance
Benchmarks and evidence-driven optimization.

### Phase 15 — Accessibility and UX
Keyboard access, semantics, responsive behavior, polish.

### Phase 16 — CI/CD
Automated verification and deployment.

### Phase 17 — Documentation
Architecture case study, decisions, benchmark methodology, interview notes.

### Phase 18 — Logging and observability (infrastructure)
Structured logging and observability for the decision engine, application layer, and infrastructure. This is an infrastructure concern and must not leak into domain logic. Logging will be injected through interfaces so domain code remains testable without capturing log output.

## 21. Definition of Done

A task is not complete merely because code exists.

A task is DONE only when:

- acceptance criteria are satisfied
- appropriate tests exist
- relevant tests pass
- type checking passes
- no unrelated regressions are introduced
- documentation is updated when necessary
- reviewer concerns are resolved
- Git state is understood
- handoff state is updated

## 22. Human Approval Required

Human approval is required before:

- changing core architecture
- adding major dependencies
- changing persistence format
- changing domain invariants
- substantially changing the scoring model
- introducing backend infrastructure
- removing tests
- weakening CI
- changing deployment strategy

## 23. Portfolio Evaluation Rule

Every major feature must answer:

1. Does it solve the core product problem?
2. Does it demonstrate engineering skill?
3. Is the complexity justified?
4. Can it be tested rigorously?
5. Can it be demonstrated visually?
6. Can the design be defended in an interview?
7. Does it improve differentiation?

If not, challenge the feature.

## 24. Resume Story

> Built an explainable project-planning engine (Trajectory) that models task dependencies, scheduling constraints, effort, value, and urgency to recommend the best next action and simulate project changes. Implemented a deterministic decision engine with composable additive scoring, critical-path analysis via the Critical Path Method, structured explainability (machine-readable factor breakdowns, assumptions, and warnings), and immutable scenario simulation — all in a framework-independent domain layer with zero runtime dependencies.

A second bullet:

> Designed a dependency-graph layer with cycle detection, deterministic topological ordering (Kahn's algorithm), and transitive traversal; measured algorithm performance across 100–10,000 task datasets (e.g., graph construction completes in ~11ms at 10,000 tasks, recommendation scoring in ~22ms). Enforced domain independence (no React/browser/persistence imports), versioned local persistence behind a repository abstraction, 287 unit/component/integration tests plus 2 Playwright E2E specs, and a four-job CI pipeline (typecheck, tests, benchmarks, build, browser E2E).

These claims are based on actual benchmark results in `benchmark/results.txt` and the test suite as of TASK-017.

## 25. Current Human Review Items

The following are intentionally provisional and should be reviewed before implementation begins:

- final product name and availability
- exact scoring weights
- exact critical-path scheduling semantics
- exact task/date model
- final UI technology choices
- whether the MVP needs all four scenario types
- final benchmark methodology

These are not blockers for creating the repository control plane, but they are blockers for treating the product specification as immutable.
