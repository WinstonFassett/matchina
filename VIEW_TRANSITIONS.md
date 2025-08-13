# View Transitions Design (Generic, Parallel, CSS-Driven)

This document proposes a reusable, adapter-agnostic approach to parallel view transitions for Matchina-powered React apps. It builds on prior SWUP-inspired parallel transitions and keeps compatibility with future native View Transitions when feasible.


## Goals

- Maintain both outgoing (from) and incoming (to) views in the DOM during transitions.
- CSS-driven animations with simple, portable class/data-attribute conventions.
- App-agnostic: works regardless of route tree specifics; plug into the router adapter.
- Opt-in per scope: enable at `<Routes>` level, and allow per-`<Route>` override.
- Respect accessibility and prefers-reduced-motion.
- Minimal runtime: no heavy dependency on timing logic; rely on CSS transition/animation end events.


## Terms

- Viewer: a component that orchestrates parallel transitions (keeps old+new views temporarily).
- Scope: the part of the view tree governed by one Viewer. A scope can be the whole route render or a nested route subtree.


## Proposed API

- Global per-`<Routes>` viewer, with optional per-`<Route>` override.
- “view” rendering remains the contract for typed route params. We do not require `element`.

```tsx
// Preferred: declare at the scope you want animated.
<Routes viewer={SlideViewer}>
  <Route name="Products" view={Products} viewer={SlideViewer}>
    <Route name="Product" view={Product} viewer={SlideViewer}>
      <Route name="ProductOverview" view={ProductOverview} />
      <Route name="ProductSpecs" view={ProductSpecs} />
      <Route name="ProductReviews" view={ProductReviews} />
    </Route>
  </Route>
</Routes>
```

- If `viewer` is omitted at a level, it inherits the nearest ancestor viewer.
- If no viewer is provided, rendering is immediate (current behavior).


## Integration points in adapter (`docs/src/code/examples/router/createRouter.tsx`)

1. Source of truth for navigation changes is the router store. We already derive `to` from `state.stack[state.index]`.
2. Expose `from` in a compatible way for transition snapshots:
   - For now, store the last rendered match as `prevTo` whenever a new `to` appears (post-render effect). This gives us a snapshot for the outgoing view.
   - In future, the store could expose `change.from/to` consistently (guards/loaders may vary timing). We already plumb `change` in context; we’ll prefer `change` if present; fallback to `prevTo` if not.
3. In `Routes`, instead of returning a single rendered node, pass it through a Viewer boundary:
   - `viewer.render({ from: prevMatch, to: currentMatch, renderNode })` where `renderNode(match)` produces the ReactNode for a specific route name+params using the existing logic.
   - If no viewer, `renderNode(to)` directly.
4. For nesting:
   - Each nested `<Route>` can supply its own `viewer`. The `Routes` composer will insert a Viewer at each level that requests one.
   - Composition order: leaf is rendered first; then parents wrap it. When a parent has a `viewer`, it wraps its child subtree with that viewer.


## Viewer responsibilities and contract

- Props:
```ts
interface ViewerProps {
  // Identification for keys: use something stable for React reconciliation
  key?: React.Key;
  // Matched route info (name, params, path) for outgoing/incoming
  from: { key: string; name: string; params: any } | null;
  to: { key: string; name: string; params: any } | null;
  // Children factory for each side; Viewer decides when to render and keep which
  render: (which: 'from' | 'to') => React.ReactNode;
  // Optional: direction hint ('forward' | 'back') from history/store
  direction?: 'forward' | 'back' | 'replace';
}
```

- Behavior:
  - When `to` changes, mount both from+to.
  - Decorate DOM for CSS (data attributes, classes) to drive animations.
  - Listen for transitionend/animationend for both items; once both are finished (or a timeout), unmount `from`.
  - On interrupted navigation (another change before complete), cancel the previous animation (best-effort) and start a new cycle.

- Suggested DOM shape:
```html
<div class="vt-scope vt-<mode>" data-vt-scope>
  <div class="vt-layer vt-from" data-vt="from">{from}</div>
  <div class="vt-layer vt-to" data-vt="to">{to}</div>
</div>
```

- Accessibility:
  - `aria-live="polite"` for the scope container (optional, context-specific).
  - Maintain focus: optionally move focus to the first focusable in `to` after enter completes, or preserve where appropriate.
  - Honor `prefers-reduced-motion: reduce` by skipping animation and swapping immediately.


## CSS contract (SWUP-style conventions)

- Classes on scope during phases:
  - `vt-entering`, `vt-exiting` on scope.
  - `vt-parallel` while both exist.
- Classes on layers:
  - `.vt-from` and `.vt-to` are always present.
- Example slide implementation:

```css
[data-vt-scope] { position: relative; overflow: hidden; }
[data-vt-scope] .vt-layer { position: absolute; inset: 0; will-change: transform, opacity; }

/* Parallel phase */
[data-vt-scope].vt-parallel .vt-from { z-index: 0; }
[data-vt-scope].vt-parallel .vt-to   { z-index: 1; }

/* Slide-left (forward) */
[data-vt-scope].vt-entering[data-vt-dir="forward"] .vt-to   { animation: vt-slide-in-left 250ms ease both; }
[data-vt-scope].vt-exiting[data-vt-dir="forward"]  .vt-from { animation: vt-slide-out-left 250ms ease both; }

/* Slide-right (back) */
[data-vt-scope].vt-entering[data-vt-dir="back"] .vt-to   { animation: vt-slide-in-right 250ms ease both; }
[data-vt-scope].vt-exiting[data-vt-dir="back"]  .vt-from { animation: vt-slide-out-right 250ms ease both; }

@keyframes vt-slide-in-left   { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes vt-slide-out-left  { from { transform: translateX(0); }   to { transform: translateX(-12%); opacity: .9; } }
@keyframes vt-slide-in-right  { from { transform: translateX(-100%);} to { transform: translateX(0); } }
@keyframes vt-slide-out-right { from { transform: translateX(0); }   to { transform: translateX(12%); opacity: .9; } }

@media (prefers-reduced-motion: reduce) {
  [data-vt-scope] .vt-layer { animation: none !important; transition: none !important; }
}
```


## Native View Transitions (optional future)

- React’s new View Transitions API integrates with `document.startViewTransition()`. It does not inherently keep two DOM trees; the browser snapshots before/after and animates between them.
- We can provide a `ViewTransitionViewer` that:
  - Starts a view transition on navigation.
  - Applies class names/data attributes to let CSS target pseudo-elements.
  - Fallbacks to parallel mode when not supported.
- For now, implement the CSS parallel viewer; keep the API compatible so a future viewer can swap in.


## Direction and keys

- Direction source: consider router store change type (push/back/replace). We already expose `history.back`. We can annotate `direction` in adapter context based on last action.
- Keys: use path or `${name}:${stableParamString}` so React treats each page as a different child in the viewer.


## Error/edge handling

- If `from === to` by key, perform a replace (no parallel).
- If a new navigation starts during an ongoing animation, cancel and start anew.
- Provide a max timeout (e.g., 750ms) to avoid hanging on missing animationend.


## Implementation plan

1. Add a small `Viewer` interface and default `ImmediateViewer` (no animation) under `docs/src/code/examples/router/viewers.tsx`.
2. Create `SlideViewer` implementing the contract above.
3. Update `createRouter.tsx`:
   - Extend `RouteProps` to allow optional `viewer?: Viewer`.
   - Extend `Routes` to accept `viewer?: Viewer` prop.
   - During composition, at each route level, wrap the currently composed child node in that level’s viewer (route-level viewer or inherited from parent).
   - Manage `prevMatch` in context to supply `from` snapshots.
4. Provide base CSS in `docs/src/code/examples/router/transitions.css` matching the contract.
5. Demo: in `RouterApp.tsx`, apply `viewer={SlideViewer}` at `<Routes>` and selectively at `Route` for nested scopes.


## Open questions

- Do we want per-route custom directions (e.g., tab switch vs. stack push)?
- How to handle scroll restoration during parallel transitions? Likely outside of the viewer scope.
- Should viewers get control over focus management hooks?


## Summary

We’ll implement a generic, CSS-driven `Viewer` abstraction that can be attached to `<Routes>` and/or individual `<Route>` nodes. It will keep outgoing and incoming views mounted in parallel until CSS animations finish, then unmount the outgoing view. This is app-agnostic, typed, and compatible with both SWUP-inspired CSS and future native view transitions.
