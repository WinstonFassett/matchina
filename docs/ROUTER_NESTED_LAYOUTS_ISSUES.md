# Router Transitions + Nested Layouts: Blocking Issues, Context, and Action Plan

This document captures the exact end-goal behavior, what regressed, why, and the minimal, surgical plan to fix it. Keep this as the single source of truth while iterating.

---

## End Goal (Definition of Done)
- __[Simultaneous views]__ During navigation, render both leaving and entering route views concurrently until CSS completes.
- __[Nested layouts]__ Apply static layouts by route name:
  - `ProductsLayout` wraps `Products` and all `Product*` routes.
  - `ProductDetailLayout` wraps all `Product*` (back/title/tabs). Only the tab body animates.
- __[No cross-wrapping]__ A leaving view is never wrapped by the entering view’s layout (e.g., `About` must not appear inside `Products` chrome).
- __[Direction-aware]__ Forward/back animations are consistent across all route pairs (Home, About, Products, Product tabs/IDs).
- __[No hacks]__ No fixed-height hacks or early hiding. CSS controls overlap/clipping/transforms; JS controls class toggling and lifecycle.

---

## Current Workspace (Key Files)
- `docs/src/code/examples/router/reactAdapter.tsx`
  - Adapter, `Routes`, `RouteLayouts`.
- `docs/src/code/examples/router/RouterDemoIdiomatic.tsx`
  - Demo, nested `RouteLayouts`, views.
- `docs/src/code/examples/router/transitions.css`
  - Transition classes (currently may be commented out during debugging).

---

## Blocking Issues (Observed)
- __[hooks warning]__ Home → About logs: "React has detected a change in the order of Hooks called by Routes".
- __[cross-wrapping]__ During some transitions, `About` appears inside the `Products` layout.
- __[layout drop]__ `Product(42)` sometimes loses `ProductDetailLayout` during navigation.
- __[param parity]__ `Product(42)` vs `Product(abc)` feel different (visual/animation parity not identical).

---

## Root Causes (What Broke)
- __[Hook order violation in `Routes`]__
  - `useContext(LayoutsContext)` was called from helpers invoked a variable number of times depending on branch (single-view vs two-view). Changing the count/order of hooks between renders triggers React’s hook-order warning.
- __[Global layout wrapping]__
  - Wrapping the entire `<Routes>` output with the "current" layout causes the leaving view to be wrapped by the entering layout → `About` shows inside `Products` during transitions.
- __[Layout chain inconsistency]__
  - If the layout chain (Products → Product) isn’t computed identically for both from/to views on every render, `ProductDetailLayout` can drop for a frame.
- __[Key/size deltas]__
  - Instability in transition keys or large DOM size diffs can create irregular motion between `Product(42)` and `Product(abc)`.

---

## Minimal Contract (Transition Engine)
- __[DOM shape]__
  - In transition: `.router-transition` contains two sibling `.view` containers, `[data-role="from"]` and `[data-role="to"]`.
  - Not in transition: exactly one `.view`.
- __[Class toggling]__
  - Pre-state: add `is-previous-container` to from-view and `is-next-container` to to-view; force reflow; then remove `is-next-container` to start animations.
  - End: listen to `transitionend` and `animationend` on both; when both complete, clear `exiting` and remove pre-state classes.
- __[Visibility]__
  - Do not set `aria-hidden` on the exiting view during transitions.
- __[Keys]__
  - Keys include `name + JSON.stringify(params || {})` for stability.

---

## Correct Layout Application Model (Nested, Per View)
- `RouteLayouts` acts as a provider only, merging a layout map into `LayoutsContext`.
- Inside `Routes`, for each rendered view (from/to/single):
  1) Compute the layout chain by matching layout keys to that view’s route name via:
     - Exact key match, OR
     - Longest prefix where the next character is uppercase (e.g., `Product` matches `ProductOverview`).
  2) Sort matches by increasing key length (outer → inner) and reduce with `React.createElement` to wrap the node.
- Outcome: each view is wrapped by its own correct nested layouts; leaving view never inherits entering view’s layout.

---

## Non-Negotiables (Rules of Hooks Compliance)
- Call `useContext(LayoutsContext)` once at the top of `Routes` (unconditional).
- Do not call hooks inside helpers. Make `wrapWithLayouts(layouts, name, node)` pure.
- Ensure the same hooks run in the same order and count on every render (single-view vs two-view must not change hook calls).

---

## Action Plan (Surgical Fixes)
1) __Adapter hook order fix__ in `reactAdapter.tsx`:
   - Move `const layouts = useContext(LayoutsContext)` to the top of `Routes`.
   - Rewrite `wrapWithLayouts`/`renderWithLayouts` to accept `layouts` as a parameter (no hooks inside helpers).
   - Use these pure helpers in both transition and non-transition branches identically.

2) __Enforce per-view nested layouts__ in `Routes`:
   - For from/to/single renders, wrap each node with its own layout chain computed from `layouts` and route name.

3) __Keep transitions known-good__:
   - Two sibling `.view` containers during transitions.
   - No `aria-hidden` on exiting view.
   - Swup-style class toggling with end listeners.

4) __Stabilize and verify__:
   - Confirm no hook-order warnings when toggling between single-view and two-view.
   - Verify layout chains for `Home`, `About`, `Products`, `Product*` are correct (log chains temporarily if needed).
   - Test `Product(42) ↔ Product(abc)` and across tabs for consistent visuals.

---

## Quick Validation Checklist
- __[Hooks stable]__ No hook-order warnings when navigating Home ↔ About.
- __[No cross-wrapping]__ About never appears inside Products layout during any transition.
- __[Static chrome]__ On `Product*`, back/title/tabs remain static; only tab body animates.
- __[Parity]__ `Product(42)` and `Product(abc)` feel identical in motion.

---

## Reference Commits
- Last known-good (transitions smooth): `c497672ef5c10ccd33e9d0286f741fc63fec5a86`
- Breaking change (structure/aria changes): `a1a261d861f266d85f0490397411fd0d561de0ef`

---

## Notes
- Avoid reintroducing shells that wrap the entire `<Routes>` output based on the current route; that pattern will always risk cross-wrapping during transitions.
- Prefer minimal CSS: overlap, clipping, and direction-aware transforms; no fixed heights.
