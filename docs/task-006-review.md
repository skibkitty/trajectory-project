# TASK-006 Implementation Review

## Summary

This document records issues found during a thorough review of the TASK-006
implementation (recommendation explainability layer in
`src/domain/decision/recommendation.ts` and supporting engine changes in
`src/domain/decision/engine.ts`).

All acceptance criteria pass and all 125 tests pass, but several issues were
identified ranging from a real immutability gap to minor code-quality and
naming inconsistencies. Severity is assigned to each.

---

## Issues

### 1. Shallow freezing — individual objects within arrays are not frozen (Severity: Medium)

**Location:** `src/domain/decision/engine.ts` lines 207-211,
`src/domain/decision/recommendation.ts` lines 151-157

**Description:**

The ADRs (ADR-007 §Consequences, ADR-008 §Consequences) state "Results are
frozen" and "the recommendation and all arrays are frozen." However, the
implementation only performs **shallow** freezing.

`Object.freeze` is applied to the top-level result object and to the
candidates/assumptions/warnings/factors **arrays**, but the **individual objects**
contained within those arrays are NOT frozen.

Verified at runtime:

| Object                                 | Expected | Actual |
|---|---|---|
| `TaskEvaluation` object                | frozen   | **false** |
| `EvaluationFactor` object (engine)     | frozen   | **false** |
| `EvaluationFactor` object (recommendation) | frozen   | **false** |
| `Assumption` object                    | frozen   | **false** |
| `RecommendationWarning` object         | frozen   | **false** |

**Evidence:**

- `engine.ts:210` — `factors: Object.freeze(evaluationFactors)` freezes the
  array but each `EvaluationFactor` literal pushed at lines 197-204 is a plain
  object, never frozen.
- `engine.ts:207-211` — the `TaskEvaluation` returned by `evaluateCandidate`
  is a plain object literal, not frozen.
- `engine.ts:278-282` — `Object.freeze({ candidates: Object.freeze(candidates),
  ... })` freezes the result and the candidates array, but `Object.freeze` on
  an array does not deep-freeze its elements.
- `recommendation.ts:151-157` — `Object.freeze(...)` on the recommendation
  object and `Object.freeze(assumptions)` / `Object.freeze(warnings)` freeze
  arrays only. The `Assumption` and `RecommendationWarning` plain-object
  literals inside are never frozen.

**Tests gap:** The existing immutability tests only check shallow freezing:
- `engine.test.ts:353-358` — checks `Object.isFrozen(result)`,
  `Object.isFrozen(result.candidates)`, and
  `Object.isFrozen(result.candidates[0].factors)` — but **not**
  `Object.isFrozen(result.candidates[0])` or
  `Object.isFrozen(result.candidates[0].factors[0])`.
- `recommendation.test.ts:276-282` — checks
  `Object.isFrozen(recommendation)`,
  `Object.isFrozen(recommendation.factors)`,
  `Object.isFrozen(recommendation.assumptions)`,
  `Object.isFrozen(recommendation.warnings)` — but **not** the individual
  elements.

**Impact:** At runtime, callers could mutate properties of individual
`EvaluationFactor`, `Assumption`, and `RecommendationWarning` objects. TypeScript
`readonly` modifiers prevent this at compile time, so the gap is only
exploitable via `as any` casts or JavaScript consumers. The documentation
claims "frozen" which implies deep immutability.

**Fix suggested:** Apply `Object.freeze` to each individual object, or use a
`deepFreeze` helper on the result structures.

---

### 2. `buildWarnings` uses an inline structural type instead of `TaskEvaluation` (Severity: Low)

**Location:** `src/domain/decision/recommendation.ts` line 77-81 (function
signature of `buildWarnings`)

**Description:**

The `candidates` parameter is typed as:
```typescript
candidates: readonly { taskId: string; score: number }[],
```

Instead of importing and using the existing `TaskEvaluation` type:
```typescript
candidates: readonly TaskEvaluation[],
```

**Evidence:** `TaskEvaluation` is already imported indirectly (via
`EvaluationFactor`), and the function only needs `taskId` and `score` from
each candidate. Using the structural type instead of the named type is a code
quality inconsistency that obscures intent and requires a redundant type
definition.

**Impact:** Minimal — the code compiles and works correctly. But it is less
maintainable and doesn't self-document the relationship to `TaskEvaluation`.

---

### 3. `zero-maximum-normalization` warning is skipped when there are no candidates (Severity: Low)

**Location:** `src/domain/decision/recommendation.ts` lines 84-91
(`buildWarnings` early return)

**Description:**

When `candidates` is empty (no eligible tasks), `buildWarnings` immediately
pushes the `no-eligible-tasks` warning and returns early:

```typescript
const top = candidates[0];
if (!top) {
  warnings.push({ id: "no-eligible-tasks", ... });
  return warnings;  // <-- early return
}
```

This skips the `zero-maximum-normalization` check. The `maxValues` are
computed over ALL tasks (not just candidates), so it is possible for
`maxValues.value` or `maxValues.urgency` etc. to be 0 even when there are no
candidates. In that case, the user would NOT see the `zero-maximum-normalization`
warning, even though the `normalization-maxima` assumption still reports the
zero maxima in its `detail`.

**ADR-008 compliance gap:** ADR-008 §Decision lists the warning emission order
as: `no-eligible-tasks`, `tie-break-applied`, `zero-maximum-normalization`,
`blocked-status-eligible`. The early return causes `no-eligible-tasks` to
suppress all subsequent warnings. ADR-008 §Consequences says "Empty and
degenerate states are self-explanatory through warnings" — but a project with
all-done tasks that happen to have all-zero values would only show
`no-eligible-tasks` and would not surface the zero-normalization condition as a
warning.

**Impact:** Minor information gap in an edge case. The data is available in the
`normalization-maxima` assumption detail, just not surfaced as a warning.

---

### 4. Grammatical awkwardness in `zero-maximum-normalization` message for 3+ metrics (Severity: Trivial)

**Location:** `src/domain/decision/recommendation.ts` line 111

**Description:**

When 3 or more metrics have zero maximum, the message uses
`zeroMetrics.join(" and ")` which produces grammatically awkward output:

> "All tasks share the same value and urgency and dependent count, so
> normalization for those metrics contributes nothing to scores."

**Evidence:** Confirmed in the test
"emits multiple warnings in a stable order" where tasks "a" and "b" both have
`value: 0`, `urgency: 0` (and `dependents: 0`), producing the double-"and"
construction.

**Impact:** Cosmetic only — the message is understood but reads awkwardly.

---

### 5. Naming deviation: `EvaluationFactor` vs `RecommendationFactor` (Severity: Low)

**Location:** `src/domain/decision/engine.ts` (interface defined here),
`src/domain/decision/recommendation.ts` (interface reused here)

**Description:**

PROJECT_PLAN.md §11 lists `RecommendationFactor` as a conceptual domain entity.
The implementation reuses the engine-level `EvaluationFactor` type for the
`Recommendation.factors` field, rather than introducing a
`RecommendationFactor` type.

**ADR-008 compliance gap:** ADR-008 §Decision does not mention
`RecommendationFactor` — it refers to "each returned factor carries a stable
`id`" without specifying the type name. PROJECT_PLAN §11 explicitly lists
`RecommendationFactor` as an entity. The implementation deviates from the
documented domain model by reusing `EvaluationFactor`.

**Impact:** No functional impact. The factor data structure is the same. The
deviation is from the documented conceptual model, which could confuse a
recruiter or reviewer cross-referencing the plan.

---

### 6. Duplicate `taskMap` construction in `recommendNextTask` (Severity: Low)

**Location:** `src/domain/decision/recommendation.ts` lines 139-142

**Description:**

`recommendNextTask` builds its own `taskMap` from the `tasks` array:

```typescript
const taskMap = new Map<string, Task>();
for (const task of tasks) {
  taskMap.set(task.id, task);
}
```

This duplicates work already done internally by `evaluateTasks` (see
`engine.ts:227` `buildTaskMap`). The `evaluateTasks` function does not expose
this internally-constructed map in its return value, forcing the
recommendation layer to rebuild it.

**Impact:** Minor inefficiency. More importantly, it suggests the API boundary
between `evaluateTasks` and `recommendNextTask` could be cleaner. The
explanation layer needs task lookups for the `blocked-status-eligible` warning,
but the evaluation layer already has this data internally.

---

### 7. Missing test coverage for edge cases (Severity: Low)

**Location:** `src/domain/decision/recommendation.test.ts`

**Missing test scenarios:**

- **`zero-maximum-normalization` with only `effort` at zero:** All tasks have
  default `estimatedEffort: 1`, so `maxValues.effort` is never 0 in existing
  tests. No test covers the case where a custom factor or explicit task
  definitions produce a zero effort maximum.

- **`zero-maximum-normalization` with only `dependents` at zero:** The
  `dependents` metric is only 0 when the dependency graph is flat (no task has
  any dependents). No test isolates this case (the existing test has
  value=0, urgency=0, and dependents=0 simultaneously, but not dependents-only).

- **`blocked-status-eligible` with multiple blocked tasks:** The existing test
  only checks a single blocked task. No test verifies that
  `affectedTaskIds` is correctly sorted when multiple BLOCKED candidates exist
  (e.g., tasks "z" and "a" both BLOCKED should produce `["a", "z"]`).

- **Determinism of warnings order across input permutations:** The test
  "produces identical output for identical inputs" uses `JSON.stringify`
  comparison, which implicitly covers warning order. But there is no explicit
  test verifying that warnings appear in the documented emission order
  (`no-eligible-tasks` → `tie-break-applied` → `zero-maximum-normalization` →
  `blocked-status-eligible`) under all combinations.

**Impact:** Low risk of undetected regressions in warning ordering and
edge-case warning content.

---

## What IS Correct

The following aspects of the TASK-006 implementation are correct and meet
the acceptance criteria:

- **Layering:** `recommendNextTask` wraps `evaluateTasks` without duplicating
  scoring logic. ✓
- **Nullable recommendation:** Returns `taskId: null` / `score: null` with
  `no-eligible-tasks` warning when no candidates exist. ✓
- **Machine-readable factors:** `EvaluationFactor` now has stable `id` field
  (`value`, `urgency`, `dependency`, `criticalPath`, `confidence`, `effort`). ✓
- **Factors retain source metrics:** `sourceMetric` strings present on each
  factor. ✓
- **Assumptions:** Fixed-order, always-present list of 6 assumptions with
  `normalization-maxima` detail reporting actual maxima. ✓
- **Warnings:** Conditional, fixed emission order, stable ids, optional
  `affectedTaskIds` (sorted for tie-break and blocked-status). ✓
- **Determinism:** Verified by JSON-equality tests across repeated and
  reordered runs. ✓
- **Engine changes:** `id` added to `EvaluationFactor`, `maxValues` exposed
  on `EvaluationResult`, `NormalizationMaxima` type exported. ✓
- **No domain dependency violations:** `recommendation.ts` imports only domain
  types — no React, Next.js, browser APIs, or persistence. ✓

---

## Recommendation for the reviewing agent

Address issues #1 (shallow freezing), #2 (structural type), and #6 (duplicate
taskMap) as they are the most clearly actionable. Issues #3, #5, #7 are lower
priority but improve robustness and documentation alignment. Issue #4 is
cosmetic.

Issue #1 is the most important: the ADRs explicitly claim "frozen" and the
runtime audit confirms individual objects are NOT frozen. This should be fixed
to match the documented contract.
