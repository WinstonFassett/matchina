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
3. In `Routes`, instead of returning a single rendered node, we compose nodes for both sides and pass them through a Viewer boundary:
   - The adapter composes a ReactNode for a given match (using current logic) and provides `fromNode` and `toNode` to the viewer along with the full `change` object.
   - If no viewer is present at this scope, we return `toNode` directly (immediate render).
4. For nesting:
   - Each nested `<Route>` can supply its own `viewer`. The `Routes` composer will insert a Viewer at each level that requests one.
   - Composition order: leaf is rendered first; then parents wrap it. When a parent has a `viewer`, it wraps its child subtree with that viewer.


## Viewer responsibilities and contract

- Props (no render callbacks; nodes are provided):
```ts
interface RouteMatchInfo {
  key: string;              // `${name}:${stableParams}`
  name: string;
  params: any;
  path: string;
}

type Direction = 'forward' | 'back' | 'replace';

interface RouterChange {
  type: 'push' | 'replace' | 'pop' | 'redirect' | 'reset' | 'complete' | 'fail';
  from: RouteMatchInfo | null;
  to: RouteMatchInfo | null;
  timestamp?: number;
  reason?: string;
}

interface ViewerProps {
  change: RouterChange;                 // full change event
  from: RouteMatchInfo | null;
  to: RouteMatchInfo | null;
  fromNode: React.ReactNode | null;     // pre-rendered outgoing node
  toNode: React.ReactNode | null;       // pre-rendered incoming node
  direction: Direction;                 // derived from store/history
  keep?: number;                        // SWUP-like keep N previous (default 0)
  onSettled?: () => void;               // after both sides finish
  classNameBase?: string;               // theme base, e.g., 'transition-slide'
}
```

- Behavior:
  - When `to` changes, mount both from+to.
  - Decorate DOM for CSS (data attributes, classes) to drive animations.
  - Listen for transitionend/animationend for both items; once both are finished (or a timeout), unmount `from`.
  - On interrupted navigation (another change before complete), cancel the previous animation (best-effort) and start a new cycle.

- Suggested DOM shape (SWUP-style classes):
```html
<section class="is-changing" data-vt-dir="forward">
  <div class="transition-slide is-next-container">{to}</div>
  <div class="transition-slide is-previous-container" aria-hidden="true">{from}</div>
  <!-- kept examples -->
  <div class="transition-slide is-previous-container is-kept-container" aria-hidden="true"></div>
  <div class="transition-slide is-previous-container is-kept-container is-removing-container" aria-hidden="true"></div>
  <!-- viewer may add inert to previous containers when supported -->
</section>
```

- Accessibility:
  - `aria-live="polite"` for the scope container (optional, context-specific).
  - Maintain focus: optionally move focus to the first focusable in `to` after enter completes, or preserve where appropriate.
  - Honor `prefers-reduced-motion: reduce` by skipping animation and swapping immediately.


## CSS contract (SWUP-style conventions)

- Scope: `.is-changing` during a transition; `data-vt-dir="forward|back|replace"` for direction variants.
- Layers use a common base class (e.g., `.transition-slide`) and roles:
  - Incoming: `.is-next-container`
  - Outgoing: `.is-previous-container`
  - Kept: `.is-kept-container` (older previous kept around)
  - Being removed: `.is-removing-container`

Example slide implementation:

```css
/* Scope container */
[data-vt-dir] { position: relative; overflow: hidden; }
.transition-slide { position: absolute; inset: 0; will-change: transform, opacity; }

/* Z-order */
.is-changing .transition-slide.is-next-container { z-index: 2; }
.is-changing .transition-slide.is-previous-container { z-index: 1; }

/* Forward */
.is-changing[data-vt-dir="forward"] .transition-slide.is-next-container { animation: slide-in-left 250ms ease both; }
.is-changing[data-vt-dir="forward"] .transition-slide.is-previous-container { animation: slide-out-left 250ms ease both; }

/* Back */
.is-changing[data-vt-dir="back"] .transition-slide.is-next-container { animation: slide-in-right 250ms ease both; }
.is-changing[data-vt-dir="back"] .transition-slide.is-previous-container { animation: slide-out-right 250ms ease both; }

/* Kept removal */
.transition-slide.is-removing-container { animation: slide-far-left 250ms ease both; }

@keyframes slide-in-left   { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slide-out-left  { from { transform: translateX(0); }   to { transform: translateX(-12%); opacity: .9; } }
@keyframes slide-in-right  { from { transform: translateX(-100%);} to { transform: translateX(0); } }
@keyframes slide-out-right { from { transform: translateX(0); }   to { transform: translateX(12%); opacity: .9; } }
@keyframes slide-far-left  { from { transform: translateX(-100%);} to { transform: translateX(-200%); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .transition-slide { animation: none !important; transition: none !important; }
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
