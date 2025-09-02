# Session Log — HSM Diagram Stability (2025-09-01)

## Objective
Stop Mermaid diagram flips by rendering the declared initial state for composite (nested) machines, not the current runtime state.

## Symptom
- Inside `state Payment { ... }`, the initial arrow `[∗] -->` flipped between `Payment_MethodEntry` and `Payment_Authorizing` during normal navigation.
- Mermaid re-rendered on each flip because the chart string changed.

## Root Cause
- `docs/src/code/examples/lib/matchina-machine-to-xstate-definition.ts:getXStateDefinition()` was deriving `initial` from `machine.getState()` mid-build (i.e., runtime state), not the declared initial.
- Nested machines amplified this because children auto-transitioned during/after composition, making the “initial” appear as the current child state.

## Wrong Turns (what we got wrong along the way)
- Tried stabilizing via memoizing/caching in `HSMMermaidInspector.tsx` → masked the symptom but didn’t fix root cause.
- Stamped `initialKey` during propagation only → could occur after child machines already moved, still allowing incorrect initial capture in certain orderings.
- Recursively used computed child definitions’ `initial` without guaranteeing they were declared initial → still could reflect runtime.

## Correct Approach
- Brand-first, duck-typed fallback:
  - Stamp the declared initial on the machine instance at creation: `(machine as any).initialKey = initialState.key`.
  - Use `initialKey` exclusively when rendering initial for any composite state.
  - If a nested child doesn’t expose `initialKey`, omit `initial` rather than guess from runtime.
- No caching; let stable initial prevent chart diffs.

## Code Changes
- `src/factory-machine.ts`
  - After constructing the machine and before any transitions, stamp the declared initial: `(machine as any).initialKey = initialState.key`.
- `docs/src/code/examples/lib/matchina-machine-to-xstate-definition.ts`
  - Top-level: set `definition.initial` from `machine.initialKey`.
  - Nested: only set `states[composite].initial` if child exposes `initialKey`; otherwise omit.
- `docs/src/components/inspectors/HSMMermaidInspector.tsx`
  - Remove caching; rely on stable definition so the chart string doesn’t flip.
- `src/nesting/propagateSubmachines.ts`
  - Leave fallback: set `initialKey` only if missing (non-invasive for external machines), but factory stamping makes this redundant for our machines.

## Before vs After
- Before:
  - `[∗] --> Payment_Authorizing` appeared when the child auto-transitioned during rendering.
  - Frequent `[MermaidInspector.chart change]` logs while moving inside `Payment_*`.
- After:
  - `[∗] --> Payment_MethodEntry` (declared initial) remains stable.
  - Chart string no longer changes on mere active-state changes; no flicker.

## Verification Steps
- Navigate among `Payment_*` states and confirm:
  - No chart diffs printed by `MermaidInspector.tsx`.
  - Initial arrow remains on `Payment_MethodEntry`.

## Lessons Learned
- Inspectors must use declared configuration, not runtime snapshots, for stable diagrams.
- Capture “declared” values at source-of-truth (factory creation), not later (propagation) where timing can race with transitions.
- Prefer omission over incorrect guesses for critical semantics (don’t synthesize initial from runtime).

## Follow-ups
- Add tests to ensure `initialKey` is stamped at creation and used by definition builder for both top-level and nested composites.
- Document the duck-typed `initialKey` convention for integrators.
