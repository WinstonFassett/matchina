# UNFUCK Report: Changes since base `fucking-ok-here-jesus-fuck`

This report summarizes the literal diffs captured in `docs/COMMIT_DIFFS.md` and pinpoints the risky/refactor changes, their effects, and concrete steps to unfuck regressions. Basepoint was established via `merge-base` and the full diffs are already generated in `COMMIT_DIFFS.md`.

## Findings

- __Router transition architecture changed__
  - Files: `docs/src/code/examples/router/reactAdapter.tsx`, `docs/src/code/examples/router/transitions.css`.
  - Key changes:
    - Introduced dual rendering paths: `renderWithLayouts_inner` vs `renderWithLayouts_outer` with an `innerOnly` toggle for product-tab-like intra-layout transitions.
    - Outer views (the `.view` shells) no longer carry `.transition-slide` by default.
    - The inner mode now expects the layout to provide `.transition-slide` around the changing content.
    - CSS selectors updated to scope transitions to `.view.is-next-container .transition-slide` and `.view.is-previous-container .transition-slide`.
    - Added `overflow: hidden` to the transition container to clip sliding content.

- __Layout contract change (breaking if not applied everywhere)__
  - Files: `docs/src/code/examples/router/RouterDemoIdiomatic.tsx` and `reactAdapter.tsx`.
  - Diff evidence:
    - `reactAdapter.tsx`: previously wrapped inner content with `<div className="transition-slide">{body}</div>` inside `renderWithLayouts_inner`. Now it relies on the layout to do so.
    - `ProductDetailLayout` was updated to wrap `{children}` with a `.transition-slide` div (see last commit `8ab0a8c7`).
  - Risk: any other layout or route that participates in inner transitions but doesn't add `.transition-slide` will have no animation and could break the CSS expectations.

- __CSS selector scope tightened__
  - File: `docs/src/code/examples/router/transitions.css`.
  - Diff evidence:
    - Forward/back selectors changed from targeting `.transition-slide.is-next-container` to `.view.is-next-container .transition-slide` (and similar for back/previous).
  - Risk: if `.transition-slide` exists outside the `.view` shell, rules won't apply. Structure must be `.view[data-role] > ... .transition-slide`.

- __Shell class adjustments__
  - File: `reactAdapter.tsx`.
  - Diff evidence:
    - Removed `transition-slide` class from the `.view` wrappers and left it only for inner content when in outer mode or in user layouts for inner mode.
    - Adjusted z-index and rings; removed `aria-hidden` on the from-view once.
  - Risk: visual/ARIA regressions (screen readers) and changed stacking if any custom CSS depends on previous classes.

- __Router demo link/name tweaks__
  - File: `RouterDemoIdiomatic.tsx`.
  - Diff evidence:
    - Several links now point to `ProductOverview` where previously `Product` was used.
    - Minor UI changes (removed a "Current View" h2, container classes, etc.).
  - Risk: name mismatches can break route matching for demos.

## Root Cause Summary

- We changed the contract for where `.transition-slide` lives without ensuring every affected layout implemented it.
- CSS rules were updated to depend on a stricter DOM shape ( `.view.*` containing `.transition-slide` ), and some views/layouts do not conform.
- Rendering path now branches (inner vs outer), but not all routes/layouts are compatible or updated.

## UNFUCK Plan (concrete steps)

1. __Harden inner rendering contract in code__
   - In `reactAdapter.tsx`, modify `renderWithLayouts_inner` to be backward-compatible:
     - Render the layout-wrapped body.
     - Detect if the resulting tree already contains a `.transition-slide` at the appropriate level.
     - If not present, wrap with `<div className="transition-slide">` to guarantee animations.
   - Net: layouts can provide their own `.transition-slide`, but we will auto-wrap if they do not.

2. __Ensure DOM structure matches CSS selectors__
   - Verify that when in outer mode, `.transition-slide` remains inside the `.view` container (`data-role="from"|"to"`).
   - If any route directly outputs `.transition-slide` outside of `.view`, move/wrap accordingly.

3. __Normalize demo layouts__
   - In `RouterDemoIdiomatic.tsx`, ensure all inner-transition layouts wrap dynamic body with `.transition-slide` (as done for `ProductDetailLayout`).
   - For routes that should not use inner mode, make sure `innerOnly` returns false for those transitions, falling back to `renderWithLayouts_outer`.

4. __Guard `innerOnly` calculation__
   - In `reactAdapter.tsx`, confirm `shouldInnerOnly(...)` is strictly limited to intra-product-tab transitions with same `id`.
   - Add unit-ish assertions/logs in development to warn when inner mode is active but `.transition-slide` is missing in the rendered subtree.

5. __CSS consistency__
   - Keep the stricter selectors (they are fine) but add a compatibility rule if needed:
     - As a temporary patch in `transitions.css`, mirror the critical forward/back transforms to catch `.transition-slide` directly marked as `.is-next-container`/`.is-previous-container` until all views are migrated. Then remove.

6. __ARIA/z-index audit__
   - Reintroduce `aria-hidden` for the `from` view during transition if it was relied upon for a11y, or justify removal.
   - Confirm stacking contexts still render correctly with the new z-indices.

7. __Route name consistency__
   - Verify all `Link` usages moved from `Product` to `ProductOverview` are consistent with the route patterns and examples. Fix any mismatches.

## Minimal Patch Outline

- __`docs/src/code/examples/router/reactAdapter.tsx`__
  - Update `renderWithLayouts_inner` to auto-wrap with `.transition-slide` if the layout did not.
  - Ensure outer mode keeps `.transition-slide` under the `.view` container.
  - Keep `renderWithLayouts_outer` as-is.
  - Optional: add dev-time warning if inner mode finds no `.transition-slide`.

- __`docs/src/code/examples/router/RouterDemoIdiomatic.tsx`__
  - Ensure `ProductDetailLayout` (and any similar layout) wraps tab body with `.transition-slide`.
  - Align all `Link` names/targets (e.g., `ProductOverview`).

- __`docs/src/code/examples/router/transitions.css`__
  - Temporarily add compatibility selectors for older structure (optional safety net), to be removed after code fixes.

## Verification Checklist

- __Tab-to-tab (same product id) slides horizontally with inner mode.__
- __Route-to-detail (list -> product) slides with outer mode.__
- __No slide when navigating top-level siblings unless desired.__
- __A11y: `from` view hidden from SR during transition if needed.__
- __No content leaking outside rounded corners (overflow hidden works).__

## References to diffs in `COMMIT_DIFFS.md`

- Inner/outer rendering refactor and layout contract: search for `renderWithLayouts_inner` and `ProductDetailLayout` changes (see near the end; commit `8ab0a8c7`).
- CSS selector updates: search for changes to `.is-next-container` / `.is-previous-container` becoming `.view.is-next-container .transition-slide`.
- Shell class changes and removed `transition-slide` on `.view`: in `reactAdapter.tsx` around the transition container render.
- Route link updates (`Product` -> `ProductOverview`): multiple hunks in `RouterDemoIdiomatic.tsx` in early commits.

---

If you want, I can apply the minimal patches now with a small, focused diff to restore compatibility while keeping the improved design. Let me know and I’ll implement steps 1–3 immediately.
