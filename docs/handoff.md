# Current Handoff

## Phase

All planned phases complete. Domain foundation, dependency graph, scheduling and critical path, decision engine, scenario simulation, persistence, application services, UI, integration coverage, algorithm benchmarks, accessibility/UX hardening, CI/CD with Playwright E2E, and architecture documentation are all implemented and passing.

## Current Task

TASK-017 — Architecture case study and final documentation (DONE). All acceptance criteria satisfied: case study written, ADR-013 added for project naming/availability, resume story updated with actual measurements, architecture.md and README.md updated to reference the case study.

## State

TASK-017 adds `docs/case-study.md` — a comprehensive architecture case study covering the core problem, domain model, dependency graph, scheduling/CPM, decision engine, explainability, scenario simulation, architecture/layering, persistence, testing strategy, measured performance (with full benchmark table from `benchmark/results.txt`), CI/CD, design tradeoffs, and repository structure. ADR-013 resolves the project naming/availability decision: product name is Trajectory, repository is `skibkitty/trajectory-project` on GitHub, availability is source code on GitHub (no deployment target for MVP). PROJECT_PLAN.md §24 resume story updated with concrete claims based on actual benchmark results and test counts. README.md and docs/architecture.md updated to reference the case study. TASK-016 is merged to main (PR #18) and marked DONE; 287 correctness/component/integration tests and 2 E2E specs pass locally, `npm run build` succeeds, and `npm run benchmark` passes (6 tests).

## Completed

- PROJECT_PLAN.md
- AGENTS.md
- opencode.json (default_agent: builder)
- agent definitions (builder, tester, reviewer, orchestrator)
- architecture document
- decision record (ADR-001 through ADR-013)
- task backlog
- progress log
- handoff document
- Git repository initialized with initial commit
- TypeScript project initialized (npm, strict mode)
- Vitest test runner configured
- ESLint + Prettier configured
- Verification commands working (typecheck, test, lint, format)
- Domain model entities: Project, Task, Goal
- TaskStatus enum (BACKLOG, TODO, IN_PROGRESS, BLOCKED, DONE)
- Factory functions with invariant validation
- Domain invariant tests (23 domain tests + 1 smoke test = 24 total passing)
- Dependency graph: prerequisite/dependent lookup, traversal, reachability, cycle detection, deterministic topological ordering
- Graph tests (34 tests = 58 total passing)
- Scheduling: forward/backward pass CPM, critical path identification, slack calculation
- Scheduling tests (13 tests = 71 total passing)
- Decision engine: eligibility rules, composable additive scoring (six default factors), deterministic lexicographic tie-breaking, structured factor breakdowns, frozen results
- Decision engine tests (31 tests = 102 total passing across 8 files)
- ADR-007 documenting eligibility, scoring model, normalization, tie-breaking, and selection policy; ADR-004 marked Accepted
- Recommendation explainability: `recommendNextTask` with machine-readable factor ids, fixed-order assumptions, ordered conditional warnings, explainable empty state, frozen deterministic output
- Engine additions: stable factor ids on `EvaluationFactor`, normalization `maxValues` exposed on `EvaluationResult`
- Review follow-up: deep freezing applied to all result objects (evaluations, factors, assumptions, warnings), `TaskEvaluation`-typed warning inputs, readable multi-metric warning formatting, additional edge-case tests
- Recommendation tests (24 tests + 1 new engine test = 129 total passing across 9 files)
- ADR-008 documenting the explainability representation
- Scenario simulation: `applyScenario` and `simulateScenario` deriving projected state without mutating the baseline
- Three scenario kinds: `delay-task`, `change-effort`, `remove-task`; deadline scenarios deferred until a date model exists (ADR-009)
- Simulation comparisons: duration delta, critical-path change, recommendation change, value removed on de-scope
- Affected-downstream reporting filtered to tasks whose schedule windows actually changed
- Simulation tests (20 tests = 149 total passing across 10 files)
- Persistence layer: `ProjectRepository` interface, `LocalProjectRepository` implementation, versioned serialization, `StorageProvider` abstraction
- ADR-010 documenting persistence design
- Persistence tests (31 tests = 180 total passing across 11 files)
- Application services: `ProjectService`, `TaskService`, `GoalService`, `DependencyService`, `RecommendationService`, `ScenarioService`
- Services use dependency injection via `ProjectRepository` interface
- Services are independently testable with stub repositories
- Application service tests (33 tests = 213 total passing across 17 files)
- React + Vite UI framework introduced (first runtime dependency)
- UI components: `Dashboard`, `ProjectSelector`, `RecommendationPanel`, `FactorBreakdown`, `WarningsPanel`, `TaskList`
- Component tests using Vitest + React Testing Library + jsdom
- 21 component tests (234 total passing across 22 files)
- Application entry points: `index.html`, `src/main.tsx`, `src/App.tsx`
- `createLocalStorageProvider` adapter bridging `StorageProvider` to browser localStorage
- Application is runnable via `npm run dev`
- CRUD UI: `ProjectForm`, `TaskForm`, `DependencyEditor` components
- Sample data: `createSampleProject` with realistic tasks, dependencies, and goals
- Dependency graph visualization: SVG-based with topological layout, critical-path highlighting, status colors, and legend
- Graph layout utility: `computeLayout` with deterministic layer assignment
- 19 new component tests (253 total passing across 27 files)
- TASK-011 merged to main and marked DONE; main restored to the verified-good CRUD UI state after a partial revert caused a broken merge (255 tests passing across 27 files)
- Scenario comparison UI: `ScenarioPanel` component (scenario kind, target task, and effort inputs; baseline vs. projected comparison table; affected-downstream and value-removed reporting; inline validation errors)
- `ScenarioService` wired through `App.tsx` and `Dashboard.tsx`; `ScenarioPanel` exported from the UI barrel
- 6 new scenario panel component tests (261 total passing across 28 files)
- Integration coverage: `src/integration/primary-workflow.test.ts` and `src/integration/recommendation-scenario.test.ts`
- Integration tests drive all six application services against a real `LocalProjectRepository` (in-memory `StorageProvider` that round-trips through actual serialization), crossing application + domain + infrastructure boundaries instead of stubbing the repository
- Primary workflow covered: create/open project → add goals/tasks → add dependencies → recommendation + factor inspection → run scenario → compare result
- Persistence isolation verified: running a scenario leaves the persisted baseline unchanged; rich task metadata round-trips intact
- Cross-service state sharing through one repository, project summaries (task/goal counts), cycle rejection across the persistence boundary, and sample-project analysis are all covered
- 13 new integration tests (274 total passing across 30 files)
- Algorithm benchmarks: `benchmark/datasets.ts` (seeded LCG task-DAG generator), `benchmark/benchmark.ts` (best-of-N wall-clock harness), `benchmark/report.ts` (format + persist table), `benchmark/benchmark.test.ts` (determinism, coverage, dependent-hub regression, report emission)
- Benchmark covers graph construction, cycle detection, topological ordering, prerequisite/dependent lookup, transitive traversal, reachability, critical-path analysis, decision scoring, recommendation, and scenario simulation at 100/1000/5000/10000 tasks
- Benchmarks run only via `npm run benchmark` (dedicated `vitest.benchmark.config.ts` + `tsconfig.benchmark.json`), not `npm test`; new dev deps: `@types/node` (type-only)
- `npm run benchmark` prints the results table and writes it to `benchmark/results.txt` (git-ignored)
- ADR-011 documenting benchmark methodology (deterministic datasets, best-of-N timing, determinism interpretation, report output, separation from correctness tests)
- 6 benchmark tests (6/6 pass under `npm run benchmark`)
- Accessibility and UX hardening (TASK-015): design system in `src/ui/styles.css` imported via `main.tsx` (CSS custom properties, card surfaces, focus-visible rings, styled loading/empty states, responsive layout below 768px); keyboard-visible skip link targeting a semantic `<main>` landmark; labeled project-actions and project-workspace regions; dependency-graph SVG marked `role=img` with aria-label; loading states as `role=status` + `aria-live=polite`; accessible names on dependency remove buttons; focus moved to the workspace heading when a project is opened (restricted to project-selection transitions); `src/vite-env.d.ts` referencing `vite/client`; 7 accessibility tests in `src/ui/accessibility.test.tsx`
- PR #17 review remediation on feat/015: fixed invisible Trajectory heading and 1:1 table-header contrast in `styles.css` (light colors on the dark page background / light header background); fixed focus-steal regression in `Dashboard.tsx` (focus now only moves on an actual project-selection transition via `previousProjectIdRef`), with a regression test; fixed missing card surfaces after reviewer follow-up — `TaskForm`/`ProjectForm`/`DependencyEditor` now carry their surface `className` (`task-form`/`project-form`/`dependency-editor`) so the card background CSS actually matches, and the unused `.section-card` selector was removed; the `workspace-heading` ("Project Workspace") — also a direct child of the dark page background — is now styled `#f1f5f9`; the dependency-graph SVG is wrapped in a scrollable region (`.graph-scroll`, `overflow: auto`, `role=region`) so long graphs scroll inside the white card while the heading and legend stay fixed
- Playwright E2E coverage (TASK-016): `@playwright/test` dev dependency, `playwright.config.ts` (single Chromium project, self-managed dev server, CI-specific retries/serial workers), `tsconfig.e2e.json`, and two specs under `e2e/` covering the primary user journey and the sample-project demo; `npm run test:e2e` type-checks the specs then runs Playwright; Playwright artifacts git-ignored; a fourth `e2e` CI job installs Chromium and uploads the report on failure; ADR-012 documents the CI/CD + E2E design
- Architecture case study (TASK-017): `docs/case-study.md` covering core problem, domain model, dependency graph, scheduling/CPM, decision engine, explainability, scenario simulation, architecture/layering, persistence, testing strategy, measured performance (full benchmark table), CI/CD, design tradeoffs, and repository structure
- ADR-013 resolving project naming and availability (product name: Trajectory, repository: `skibkitty/trajectory-project`, availability: source code on GitHub)
- Resume story (PROJECT_PLAN §24) updated with concrete claims based on actual benchmark results and test counts

## Not Yet Started

- Branch protection / required status checks on GitHub (human repository-settings action, not a repo-file change)
- Phase 18 — Logging and observability (structured logging for domain, application, and infrastructure layers)

## Human Decisions Still Needed

These are intentionally provisional:

1. Exact decision-engine weights (currently all 1).
2. Exact scheduling/calendar semantics (dates, deadlines, working days).
3. Final MVP scenario scope (deadline-change scenario deferred until a date model exists).
4. Whether to implement a weighted-random selection policy.

Project naming and availability are resolved per ADR-013: product name Trajectory, repository `skibkitty/trajectory-project`, availability as source code on GitHub with no deployment target for MVP.

## Next Recommended Action

TASK-017 is the final task in the current backlog. All planned implementation phases are complete. Possible next steps (not yet defined as tasks):
- Phase 18 — Logging and observability (structured logging via injected interfaces)
- Calendar-based scheduling (date model, deadline scenarios)
- Weighted-random selection policy (requires `RandomSource` abstraction)
- Deployment configuration (if a deployment target is chosen)
- Branch protection / required status checks (human action)

## Verification

TASK-017 verification is complete. Locally: `npm run verify` (typecheck, 287 tests, lint, format:check), `npm run build`, and `npm run benchmark` (6 tests) all pass. `npm run test:e2e` (2 Playwright specs) also passes with browsers installed. All documentation is accurate against the implemented codebase.

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
