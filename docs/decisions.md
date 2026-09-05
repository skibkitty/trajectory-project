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

## ADR-013 — Project Naming and Availability

### Status
Accepted

### Context
TASK-017 requires resolving the final product name and availability decision (PROJECT_PLAN §25). The project has been referred to as "Trajectory" throughout development. The GitHub repository is `skibkitty/trajectory-project`. The npm package name in `package.json` is `trajectory-project`.

### Decision

- **Product name**: Trajectory. The name reflects the project's focus on trajectory analysis — understanding where a project is headed and what the best next move is.
- **Repository**: `skibkitty/trajectory-project` on GitHub. The repository is public and serves as the portfolio demonstration.
- **Availability**: the project is a portfolio piece, not a published npm package or SaaS product. It is available as source code on GitHub for inspection and demonstration. No deployment target is defined for MVP; the application runs locally via `npm run dev`.
- **Branding**: the UI uses "Trajectory" as the application name. The `package.json` description reads: "Trajectory is an explainable project-planning and decision-support engine that recommends the best next task from a project's current state."

### Consequences
- The product name is stable and used consistently across documentation, UI, and repository metadata.
- No deployment or distribution infrastructure is required for MVP.
- The name can be changed later if needed, but all ADRs, documentation, and code references use "Trajectory."

## Pending Decisions

- exact score weights
- exact scheduling/calendar semantics
- date/time representation
- whether all proposed scenario types belong in MVP
- final UI stack

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
- **Output**: each candidate carries a frozen array of factors with label, signed contribution, direction, source metric, and explanation. Results are deeply frozen — the result object, candidate arrays, each `TaskEvaluation`, and every individual factor object.

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

## ADR-008 — Recommendation Explainability Representation

### Status
Accepted

### Context
TASK-006 requires recommendation reasoning to be structured data: machine-readable factors that retain source metrics, representable assumptions and warnings, and a deterministic explanation. PROJECT_PLAN §7 defines the conceptual shape (`task`, `score`, `factors[]`, `assumptions[]`, `warnings[]`). The engine already returns per-factor breakdowns; this record specifies the explanation layer implemented in `src/domain/decision/recommendation.ts`.

### Decision

- **Layering**: `recommendNextTask(tasks, graph, schedule, factors?)` wraps `evaluateTasks` and derives explanations from its output; scoring logic is not duplicated. Custom factor sets pass through unchanged.
- **Nullable recommendation**: when no task is eligible, the result carries `taskId: null`, `score: null`, empty factors, plus a `no-eligible-tasks` warning — an explainable empty state instead of a bare null.
- **Machine-readable factors**: each returned factor carries a stable `id` (`value`, `urgency`, `dependency`, `criticalPath`, `confidence`, `effort`) alongside its human label, signed contribution, direction, source metric string, and explanation. `EvaluationResult` now also exposes the normalization `maxValues` so callers can show what scores were anchored against.
- **Factor representation**: PROJECT_PLAN §11's conceptual `RecommendationFactor` entity is realized by reusing the engine's `EvaluationFactor` — one shared representation across evaluation and explanation instead of duplicated shapes.
- **Assumptions**: a fixed-order, always-present list of statements describing model semantics — additive model, default-factor-set normalization (with the actual maxima as `detail`), confidence used directly as [0, 1], CPM-derived critical path, tie-break policy, and provisional weights. Assumptions are constant for a given input and independent of input ordering.
- **Warnings**: emitted only when their condition holds, in a fixed order: `no-eligible-tasks`, `tie-break-applied`, `zero-maximum-normalization`, `blocked-status-eligible`. Each has a stable id, message, and optional sorted `affectedTaskIds`.
  - Tie detection compares rounded scores at ranking precision, so the warning and the selection can never disagree; `affectedTaskIds[0]` is always the selected task.
  - Zero-maximum covers value, urgency, effort, and dependent counts uniformly — including dependent counts, because a flat dependency graph silently deactivates the dependency factor and that is worth surfacing.
  - Score-derived warnings (`tie-break-applied`, `zero-maximum-normalization`, `blocked-status-eligible`) are emitted only when at least one candidate exists. With no eligible tasks the explanation centers on `no-eligible-tasks`; degenerate normalization remains visible through the `normalization-maxima` assumption detail.
- **Immutability and determinism**: the recommendation, all of its arrays, and every contained factor/assumption/warning object are frozen; output is a pure function of inputs, verified by JSON-equality tests across repeated and reordered runs.

### Alternatives considered
- Natural-language prose explanations: rejected — the UI converts structured facts into language, per PROJECT_PLAN §7.
- Deriving assumptions dynamically from the active factor set: deferred. Assumption statements are worded to describe the default factor set's contract; a caller supplying custom factors owns describing them. Revisit if custom factor sets become a primary use case.

### Consequences
- The UI can key explanations off stable ids rather than display strings.
- Empty and degenerate states are self-explanatory through warnings.
- Adding a new warning type requires assigning it a place in the documented emission order.
- Tie-breaking continues to rely on `localeCompare` (per ADR-007), which is deterministic on a given runtime but not guaranteed byte-stable across ICU environments; acceptable for MVP, revisit only if cross-machine reproducibility becomes a hard requirement.
- Explanations inherit engine determinism guarantees; no additional randomness exists in the layer.

## ADR-009 — Scenario Simulation Design

### Status
Accepted

### Context
TASK-007 requires comparing a baseline project state with deterministic what-if scenarios without mutating that baseline. Acceptance criteria: baseline remains unchanged, at least the task-delay scenario works, affected downstream tasks are reported, recommendation changes can be compared, and scenario isolation is tested. Implemented in `src/domain/simulation/simulation.ts`.

### Decision

- **Scenario kinds**: `delay-task` (adds positive effort to a task's duration), `change-effort` (replaces effort), and `remove-task` (de-scopes). A fourth plan scenario, *change a deadline*, is deferred: the domain has no date/deadline model yet (calendar semantics remain an open human decision, PROJECT_PLAN §25), so there is nothing meaningful to mutate. Revisit once dates exist.
- **Derivation over mutation**: `applyScenario(tasks, scenario)` returns a new array. Only the targeted task is rebuilt via `createTask`; untouched task objects keep their identity (`===`). For `remove-task`, surviving tasks keep identity unless they referenced the removed task, in which case that dependency entry is stripped — de-scoping must leave a constructible graph, and silently dropping the edge is preferable to rejecting the scenario or leaving dangling references.
- **Reuse of domain layers**: `simulateScenario` builds baseline and projected state through the existing `createDependencyGraph`, `calculateSchedule`, and `recommendNextTask` functions. No scheduling or scoring logic is duplicated, so scenarios automatically inherit CPM semantics (ADR-006) and the deterministic engine (ADR-007/008), including custom factor-set pass-through.
- **Affected downstream**: the target plus its transitive dependents, filtered to tasks whose `[earliestStart, earliestFinish]` window actually changed between baseline and projected schedules, sorted lexicographically. "Affected" means a measurable schedule change — merely being downstream of the change is not enough. A removed task never appears (it does not survive into the projection).
- **Comparison shape**: each side (`baseline`, `projected`) exposes `projectDuration`, `criticalPath`, `recommendedTaskId`, `recommendedScore`. Deltas: `durationDelta` (rounded to three decimals, matching engine precision), `criticalPathChanged` (ordered id-sequence equality), `recommendationChanged` (selected id equality), and `valueRemoved` (target value, present only for `remove-task`).
- **Determinism and immutability**: the result and its nested arrays are frozen; `scenarioTasks` is sorted by id so serialization is independent of input order; output is verified by JSON-equality across repeated and reordered runs. Cyclic inputs throw through the normal scheduling path — no special handling.

### Alternatives considered
- Cloning and mutating a full Project aggregate: rejected — task-array derivation is sufficient, keeps identity semantics explicit, and avoids inventing project-copy semantics before the application layer exists.
- Reporting all transitive dependents as "affected": rejected — it conflates reachability with impact and would misreport branches absorbed by slack.
- Comparing `recommendedScore` deltas across sides: rejected as a change signal — normalization maxima are pool-relative (ADR-007), so removing a high-value task changes the scale itself; selection-id comparison is the honest signal. `recommendedScore` remains exposed per side for inspection, not cross-side subtraction.

### Consequences
- The UI can show duration/critical-path/recommendation deltas with confidence that neither side mutated user data.
- New scenario kinds require only a new `Scenario` variant, an `applyScenario` case, and tests — no changes to engine, scheduler, or recommender.
- Because delay/change-effort rebuild one task, any future task fields added to `CreateTaskInput`/`Task` must be carried through `rebuildTask` or they will be silently reset during those scenarios.
- Cross-side score comparison is not meaningful when the task pool shrinks; documentation and UI copy must not imply it is.
- Deadline scenarios remain unimplemented until a date model is decided and approved.

## ADR-010 — Local Persistence Design

### Status
Accepted

### Context
TASK-008 requires persisting projects locally behind a repository abstraction. The domain layer must remain independent of browser APIs and persistence implementations. The stored format must be versioned from the first durable implementation.

### Decision

- **Repository interface**: `ProjectRepository` in `src/application/repository.ts` defines `save`, `load`, `list`, and `delete` methods. All methods are async to support future filesystem or network backends, even though the current localStorage-backed implementation is synchronous.
- **Storage abstraction**: `StorageProvider` in `src/infrastructure/storage.ts` defines `getItem`, `setItem`, `removeItem`, and `keys`. This decouples the repository from any specific storage mechanism (localStorage, Node.js fs, in-memory, etc.) and enables testing without browser APIs.
- **Concrete implementation**: `LocalProjectRepository` in `src/infrastructure/local-repository.ts` uses a `StorageProvider` to persist projects under prefixed keys (`trajectory:project:{id}`). It serializes to JSON on save and deserializes on load.
- **Serialization format**: `ProjectData` in `src/infrastructure/serialization.ts` mirrors the domain model with an added `schemaVersion` field. Version 1 is the initial format. Serialized output is deeply frozen.
- **Schema validation**: deserialization validates `schemaVersion` strictly — older versions are rejected (no implicit migration), newer versions are rejected (data may be incomparable), and the current version proceeds with field validation.
- **Field validation**: every required field is type-checked; missing optional fields fall back to domain defaults via `createTask`, `createGoal`, and `createProject` factories — the same invariant validation used elsewhere.
- **Dependency entry validation** (TASK-022): a task's `dependencies` field, when present, must be an array of strings. A missing or non-array `dependencies` value falls back to the domain default (empty list), consistent with the optional-field convention above. An array containing a non-string entry is **rejected** with a descriptive error rather than silently filtered — dropping entries on load would quietly change the persisted project state. Serialization copies and freezes `dependencies`, so mutating the caller's task array after `serialize` cannot alias into the stored output (the serialized output is deeply frozen per the format contract).
- **Corrupted data handling**: `list()` skips entries that fail JSON parsing or deserialization rather than failing the entire list. `load()` propagates deserialization errors to the caller.
- **Project summaries**: `list()` returns lightweight `ProjectSummary` objects (id, name, description, task count, goal count) sorted by id, avoiding deserialization of full project graphs when only metadata is needed.

### Alternatives considered
- Embedding persistence in the domain layer: rejected — violates ADR-002 (domain independence).
- Using `any` or untyped JSON without schema versioning: rejected — the first durable format must be versioned per PROJECT_PLAN §14.
- Migrating older schema versions automatically: deferred — the format is young enough that rejection is simpler and safer than migration logic.

### Consequences
- The repository interface can be implemented by any backend without changing domain or application code.
- Testing uses an in-memory `StorageProvider` with no filesystem or browser dependency.
- Schema versioning provides a foundation for future migration logic when the format changes.
- Serialization round-trips are covered by dedicated tests; repository CRUD, list ordering, and corrupted-entry handling are also tested.

## ADR-011 — Benchmark Methodology

### Status
Accepted

### Context
TASK-014 requires measuring the key domain algorithms at meaningful graph sizes without claiming unmeasured performance. PROJECT_PLAN §16 requires measuring only operations that matter, benchmarking after correctness exists, and supporting at least 100, 1000, 5000, and 10,000 task datasets. PROJECT_PLAN §16 also forbids inventing performance claims.

### Decision

- **Location and separation**: benchmarks live in `benchmark/` outside `src/`, and run under a dedicated Vitest config (`vitest.benchmark.config.ts`) via `npm run benchmark`. The default `npm run test` (which targets `src/**`) does not run benchmarks — they stay out of CI's fast feedback loop. A separate `tsconfig.benchmark.json` type-checks the benchmark sources (it must compile like any other code).
- **No benchmark-specific domain code**: only the public domain API (`createDependencyGraph`, `calculateSchedule`, `evaluateTasks`, `recommendNextTask`, `applyScenario`/`simulateScenario`) is exercised. No benchmark code is added to `src/domain`. The only new runtime dependency type is `@types/node` for the benchmark harness (Node's `process.hrtime`), a dev-only type package — the domain remains dependency-free.
- **Deterministic datasets**: `benchmark/datasets.ts` generates reproducible task DAGs from a seeded linear-congruential generator. A given `seed` always yields the identical task set (id, metadata, dependencies). Tasks depend only on earlier tasks, so the graph is a guaranteed acyclic DAG with a non-trivial structure; each task may have 0–2 prerequisites, and value/urgency/effort/confidence vary across a deterministic stream.
- **Measurement methodology**: a given operation is timed over several iterations (best-of-N: 50 for ≤100 tasks, 20 for ≤1000 tasks, 5 for ≤5000 tasks, 2 for 10,000 tasks) using `process.hrtime.bigint()`. Iteration counts drop as dataset size rises so the full matrix completes in a tolerable wall-clock time. Both mean and minimum wall-clock milliseconds are reported, plus the iteration count, so the reader can judge stability. The methodology is fixed and documented; raw timings are inherently machine-dependent and are not presented as a cross-machine claim.
- **Dataset sizes**: `benchmark/datasets.ts` provides 100, 1000, 5000, and 10,000 task datasets (`DATASET_SIZES`), covering every size PROJECT_PLAN §16 requires.
- **Covered operations**: graph construction, cycle detection, topological ordering, prerequisite/dependent lookup, transitive (all-prerequisite / all-dependent) traversal, reachability across all nodes, critical-path analysis, decision-engine scoring, recommendation explainability, and scenario simulation — each reported at each dataset size. Dependent lookups target a task that actually has dependents (the dependent hub) rather than a leaf, so the measurement is non-trivial.
- **Explicit report output**: `npm run benchmark` prints a results table to the terminal and writes the same table to `benchmark/results.txt` (git-ignored) as an explicit output artifact, so the promised report is produced even when a runner captures console output.
- **Determinism guarantee**: because datasets are deterministic and the domain algorithms are deterministic (ADR-005/006/007), repeated and reordered runs of the harness produce identical *domain results*. The benchmark tests verify this (identical `topologicalOrder`, `criticalPath`, evaluation, and recommendation across runs; scenario application leaves input unmutated) rather than asserting that wall-clock nanoseconds are bit-identical, which would be meaningless.

### Alternatives considered
- Using a dedicated benchmarking library (e.g. `benny` or `tinybench`): rejected — a hand-rolled best-of-N loop is transparent, has no dependencies, and is more than sufficient for coarse wall-clock comparisons.
- Running benchmarks as part of `npm test`: rejected — it would slow the default suite and conflate correctness with performance feedback.
- Publishing absolute timings as performance claims: rejected — timings are machine-dependent; the task and this record treat them as relative signals for future optimization, per PROJECT_PLAN §16's "optimization must follow measurement".

### Consequences
- `npm run benchmark` type-checks and runs the benchmark suite, printing a results table grouped by operation and dataset size and writing it to `benchmark/results.txt`.
- Correctness tests and benchmarks are cleanly separated in both tooling and source layout.
- The seeded-dataset generator and harness already cover the 10,000-task size (PROJECT_PLAN §16) and can grow further without changing the methodology.
- No performance claims are added to the resume story until measurements are actually produced and placed in context.

## ADR-012 — CI/CD Workflow and Playwright E2E Coverage

### Status
Accepted

### Context
TASK-016 requires automated verification and eventual deployability. The local verification gate (`npm run verify`), benchmark harness (`npm run benchmark`), and production build (`npm run build`) must run on every push/PR to main so regressions are caught without relying on a developer's local machine. PROJECT_PLAN §15 also calls for E2E coverage of the primary user journey, deferred from TASK-013 to TASK-016. There was no existing CI configuration.

### Decision

- **Workflow**: `.github/workflows/ci.yml` defines three (`verify`, `benchmark`, `build`) plus a fourth `e2e` job, all on `ubuntu-latest` with Node 24 and `npm ci` (npm cache via `actions/setup-node`), triggered on push and pull_request to main. Any failed job fails the workflow.
  - `verify` runs the full local gate: typecheck, unit/component/integration tests, lint, and format check.
  - `benchmark` runs the benchmark suite and uploads `benchmark/results.txt` as a `benchmark-results` artifact with `if-no-files-found: error`, so a missing report fails the job — the artifact contract is testable rather than silently warnable.
  - `build` runs the production Vite build.
  - `e2e` installs Chromium (`npx playwright install --with-deps chromium`), runs `npm run test:e2e`, and uploads the Playwright HTML report as a `playwright-report` artifact only on failure (`retention-days: 14`).
- **Concurrency**: a workflow-level `concurrency` group keyed by workflow + PR number/branch with `cancel-in-progress: true` ensures only the latest commit's CI run proceeds per PR, cancelling in-flight runs for superseded commits instead of wasting capacity on parallel redundant jobs.
- **Playwright configuration**: `playwright.config.ts` uses a single Chromium project, `fullyParallel` locally, a self-managed dev server via `webServer` (`npm run dev`, `reuseExistingServer: !CI`), and CI-specific settings (`forbidOnly`, `retries: 2`, `workers: 1`, HTML reporter). Serial workers in CI reduce cross-test interference at the cost of wall-clock time.
- **Browser matrix**: E2E is intentionally Chromium-only for MVP. A single supported browser keeps CI cost and browser-download size bounded and matches the plan's "smallest justified setup" principle; no cross-browser support is claimed. Expanding the matrix to WebKit/Firefox is a documented follow-up only if evidence of a real cross-browser defect justifies the added CI time.
- **E2E scope**: two specs under `e2e/` exercising real browser behavior against the real persistence/app layer stack (localStorage-backed):
  - `primary-journey.spec.ts` — the PROJECT_PLAN §15 journey: create project → add tasks → add dependencies → view recommendation → inspect factor explanation → run a delay scenario → compare baseline vs. projected → de-scope a task → confirm the recommendation changes and value removed is reported → verify the baseline project is unchanged.
  - `sample-project.spec.ts` — seeds the sample project and asserts the deterministic recommendation, factor breakdown, rendered dependency graph with critical-path marking, and legend.
- **Separation from correctness tests**: E2E specs live in `e2e/` (outside `src/`), excluded from Vitest by its `include` pattern, and run only via `npm run test:e2e`. `tsconfig.e2e.json` type-checks the specs; `npm run test:e2e` runs `tsc` on it first so type errors fail locally and in CI. Playwright artifacts (`test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`) are git-ignored.
- **Branch protection**: blocking merge on the required status checks must be configured in the GitHub repository settings by a human; the workflow itself cannot enforce it.

### Alternatives considered
- Running E2E as part of `npm run verify`: rejected — it would couple the fast feedback loop to browser downloads and a dev-server run.
- Adding Playwright browsers via `postinstall`: rejected — forces ~100+ MB downloads on every contributor install, including the benchmark/CI paths that never run E2E.
- Deferring E2E entirely: rejected — TASK-013 explicitly scheduled it with TASK-016, and the primary journey is the product's central demonstration.

### Consequences
- Every push/PR to main now gates on typecheck, tests, lint, format, benchmark, build, and browser E2E.
- E2E catches integration bugs that fake-DOM component tests cannot (real routing, real localStorage persistence, real browser layout/interaction).
- The benchmark report and Playwright HTML report are inspectable as CI artifacts.
- A deliberate breaking change will fail its corresponding job, satisfying TASK-016's verification requirement.
- `npm run test:e2e` requires Playwright browsers installed (`npx playwright install chromium`), which is documented in the verification path and handled in CI.
- E2E assertions on the deterministic recommendation (e.g. sample project recommends `t4`) will need updating if the scoring model changes, by design — they re-validate the demo story.

