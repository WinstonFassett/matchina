# Nested Routes and Views: Design Notes

Date: 2025-08-13
Branch: nested-routes

## Goals

- Ergonomic, typed nested routing that matches Matchina’s HSM philosophy.
- Parent-first ownership of structure; child-first handling for local events.
- Minimal runtime footprint; usage-first API; no global singletons.
- Coexist with current `Routes` JSX composition in `docs/src/code/examples/router/RouterApp.tsx`.
- Enable optional DevTools tracing for route transitions.

## What we learned from Nested State Machines (HSM)

- **Child-first routing works well**: Events go to the active child first; bubble if unhandled.
- **Exit signals are useful**: Children can signal completion via explicit `final` or via heuristic (no nested machine). Parent decides next steps.
- **Addressable children**: Optional `id` enables typed routing and payload tagging.
- **Immutable self-transitions**: No-op when `to.key === from.key` preserves reference identity.
- **Duck-typed children**: We can interop with minimal objects exposing `dispatch`/`send`.
- **Optional DevTools**: A bridge can surface transitions without adding hard deps.

These map naturally to routing with nested views.

## Mapping to Routing

- **Route segment as a state**: Each route segment corresponds to a state in a RouteMachine.
- **Nested routes as nested machines**: A parent route state can own a child `machine` representing sub-routes.
- **Child-first routing for URL and UI events**: URL-derived events (parse result) should target the deepest responsible child first; unhandled bubble to parent to update shell.
- **Exit as redirects**: A route state can mark `final: true` to indicate it should redirect to a sibling/parent route.
- **Addressability**: Route instances (e.g., tabs) may carry `id` or params for targeted updates.

## Proposed Primitives (usage-first)

- **withSubroutes(childFactory, { id? })**
  - Sugar over `withSubstates` specialized for routing; embeds a child route machine under a route state’s `data.machine`.
  - Optional: alias to `withSubstates` initially to avoid runtime changes.

- **routeFacade(parent)**
  - Like `routedFacade`, but typed with route event unions (URL + UI). Optional; can come later.

- **parse/url events**
  - Normalize URL changes into events like `"url.changed"` with payload `{ path, params, query }`.
  - These bubble child-first to allow deep segments to claim.

- **redirect helper**
  - Small helper to produce a transition + side-effect (e.g., update hash) when a state is `final` or guard fails.

- **devtoolsBridge** (already added)
  - Reuse for route transitions.

## Event Flow

- **External**: History/hash change -> emit `url.changed` to the root RouteMachine.
- **Child-first**: Deepest active child inspects the payload; if it matches its segment, it updates state; else bubble.
- **UI events**: `Link`/`navigate` produce either URL change first (preferred) or direct route events; still child-first handled.
- **Redirects**: States may emit redirects by transitioning to a `final` route state that triggers a parent redirect decision.

## Data Model

- **State shape**: `{ key: "Products", data: { params, query, machine?: Child } }`.
- **Params/Query** live on the state; child inherits relevant subset via factory.
- **Addressability**: Optional `id` for parallel nested views (e.g., multiple tabs). Payloads include `{ id }` when present.

## View Composition

- Current composition in `RouterApp.tsx` nests `Routes` three levels.
  - Outer `Routes` selects high-level shells (`Home`, `About`, `Products`, `User`).
  - Middle `Routes` ensures `Product` shell shows for sub-routes.
  - Inner `Routes` switches tab content (`ProductOverview`, `ProductSpecs`, `ProductReviews`).
- The RouteMachine(s) should drive which view keys are active and the params used by each layer.
- Keep `Routes` as thin mappers from machine state -> React components.

## Defaults and Redirects

- Default child route (e.g., `/products/:id` -> `/overview`) implemented as:
  - Child route state with `final: true` in a “default” state that triggers transition to specific tab state.
  - Or a guard on `url.changed` that resolves to `Overview` when no child segment present.

## Errors and Boundaries

- Unmatched URL segments bubble to parent; parent can transition to `NotFound` state.
- Error boundaries can be modeled as states with `final: true` to push user to a safe parent.

## DevTools and Debugging

- Use `devtoolsBridge(machine, { name: "Router", trace: false })` to visualize route transitions.
- Optionally log parsed URL payloads and resulting states for step-by-step tracing during development.

## Minimal Path Forward

1. **Introduce url.changed event** at root; wire history/hash listener in docs app.
2. **RouteMachine skeleton** with states mirroring `RouterApp.tsx` layers:
   - AppRouteMachine: `Home | About | Products | User | Product*` where `Product*` owns a child.
   - ProductRouteMachine: `Product | ProductOverview | ProductSpecs | ProductReviews` (with child for tabs if desired).
3. **withSubroutes** alias to `withSubstates` for now; use `{ id }` for addressability where helpful.
4. **Default redirect** implemented via explicit `final: true` state or guard.
5. **Wire `Routes` components** to read from machines’ active keys and params.
6. **Add e2e tests** (Playwright specs you added under `e2e/`) to validate nav flows.

## Open Questions

- Should `Routes` own the URL <-> event sync, or should a separate tiny adapter handle history integration?
- Do we want one root RouteMachine or multiple per section? (Lean toward one root with nested children.)
- How do we best type params across nested layers without heavy generics?

## Non-goals (for now)

- Full-blown router replacement; we’re building a typed, composable demo to showcase primitives.
- SSR/hydration complexities beyond basic path/params handling.

## Next Steps (concrete)

- Add a tiny `historyAdapter` in docs app: on hashchange -> `root.send("url.changed", payload)`.
- Create `RouteMachine` factories for App and Product; embed via `withSubroutes`.
- Update `RouterApp.tsx` to read machine state and drive the three nested `Routes`.
- Plug `devtoolsBridge` for inspection during development.
- Expand e2e specs as features land.
