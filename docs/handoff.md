# Current Handoff

## Phase

Domain core complete (Phases 1–5 of the implementation plan: model, graph, scheduling, decision engine, scenario simulation). Persistence implemented. Application services implemented. UI foundation complete. CRUD UI and dependency visualization complete. Scenario comparison complete. Integration coverage complete. Algorithm benchmarks implemented. Accessibility and UX hardening complete.

## Current Task

TASK-016 — CI/CD (implemented on feat/016-ci-cd) — automate verification and deployment via GitHub Actions. Adds a CI workflow that runs the full local verification gate (`npm run verify`), the benchmark suite (`npm run benchmark`), and the production build (`npm run build`) on every push/PR to main, and uploads the benchmark report as an artifact. Pending PR review and merge; branch protection for required status checks must be configured in the GitHub repository settings by a human.

## State

TASK-016 adds `.github/workflows/ci.yml` with three independent jobs: `verify` (typecheck, tests, lint, format via `npm run verify`), `benchmark` (runs `npm run benchmark` and uploads `benchmark/results.txt` as a `benchmark-results` artifact with `if-no-files-found: warn`), and `build` (production `vite build`). All jobs run on `ubuntu-latest` with Node 24 and `npm ci` (npm cache enabled via `actions/setup-node`). Workflow triggers on push and pull_request to `main`. No production code changes — this is purely infrastructure configuration. TASK-015 is merged to main (PR #17) and marked DONE; 287 correctness/component/integration tests pass locally, `npm run build` succeeds, and `npm run benchmark` passes (6 tests) and writes `benchmark/results.txt`.

## Completed

- PROJECT_PLAN.md
- AGENTS.md
- opencode.json (default_agent: builder)
- agent definitions (builder, tester, reviewer, orchestrator)
- architecture document
- decision record (ADR-001 through ADR-010)
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

## Not Yet Started

- Browser-level E2E coverage (deferred to TASK-016 CI/CD)

## Human Decisions Still Needed

These are intentionally provisional:

1. Final product name and availability.
2. Exact decision-engine weights.
3. Exact scheduling/calendar semantics.
4. Final MVP scenario scope.
5. Benchmark methodology.

## Next Recommended Action

Create a PR for feat/016-ci-cd (TASK-016), review, and merge to main. Once merged, proceed to TASK-017 — Architecture case study and final documentation.

## Verification

TASK-016 verification is complete locally: `npm run verify` (typecheck, 287 tests, lint, format), `npm run build`, and `npm run benchmark` (6 tests) all pass. CI itself must be verified by pushing to GitHub and observing the workflow run on the PR.

## Important Constraint

Domain code must not depend on React, Next.js, browser APIs, or persistence.
