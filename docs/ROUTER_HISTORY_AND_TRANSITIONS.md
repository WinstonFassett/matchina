# Router History and Transitions: Semantics, Data Flow, and Implementation

Date: 2025-08-14
Branch: nested-routes
Status: Draft (0.1)

## Goals

- Strong, predictable URL-driven navigation with correct animation direction for push, replace, and browser back/forward.
- Transitions occur only at nesting levels whose view identity changes.
- Keep `createRouter()` and the core store/history clean and route-agnostic.
- Avoid flicker by rendering exit and entry views simultaneously.
- Support pathname and hash routing.

## High-Level Semantics

- __Actions__ (from the history driver): `push`, `replace`, `pop`.
- __Direction__ (for animations): `forward`, `back`, `replace`.
- __Rule__:
  - `push` → `forward`
  - `replace` → `replace`
  - `pop` → compare an internal "index" to decide `back` vs `forward`.

Why `pop` needs comparison: Both Back and Forward buttons produce a browser POP navigation. The browser does not tell us which one. A session index in `history.state` solves this.

## Data Flow

1. __History Adapter__ (`src/router-history.ts`)
   - Maintains `history.state.__vtIdx`: a session-scoped monotonic index.
     - On start, seed to `0` if absent.
     - On `push`, increment and write via `pushState`.
     - On `replace`, keep the current index and write via `replaceState`.
   - Listens to browser events:
     - `popstate` (and `hashchange` when `useHash`): dispatch `store.pop(path)`.
   - Dispatches to store with the normalized `path`.

2. __Router Store__ (`src/router-store.ts`)
   - Minimal state: `{ path: string }`.
   - Transitions update `path` (no-ops if unchanged): `push(path)`, `replace(path)`, `pop(path)`.
   - Exposes `getState()` and `getChange()` with `{ type, params, from, to }`.

3. __Router Provider__ (`docs/src/code/examples/router/createRouter.tsx`)
   - Reads store `state` and `change` per render.
   - Computes `from`/`to` by matching `path`.
   - Computes `navDir`:
     - If `change.type === 'push'` → `forward`.
     - If `change.type === 'replace'` → `replace`.
     - If `change.type === 'pop'` → read `window.history.state.__vtIdx` and compare with a `prevIdxRef` captured from last render:
       - `currIdx < prevIdxRef` → `back`.
       - `currIdx > prevIdxRef` → `forward`.
     - Update `prevIdxRef = currIdx` after computing.
   - Provides `navDir`, `from`, `to` via context.

4. __Routes__ (data-only adapter)
   - At each nesting level, computes `viewKey` and `prevViewKey` from the matched route for that level.
   - Passes those to the chosen `viewer` (`SlideViewer`) along with `direction`.

5. __SlideViewer__ (`docs/src/code/examples/router/viewers.tsx`)
   - Renders previous and current view layers in parallel with distinct keys.
   - Sets CSS data attributes:
     - `data-vt-dir` = `forward|back|replace`.
     - `data-vt-changing` = `true` when `viewKey !== prevViewKey`.
   - Only animates when `scopeChanged` (per-level identity changed). Keeps exit view mounted until animation completes.

## Why This Works

- The history layer is the single source of truth for actions. It emits `pop` on both Back and Forward.
- The provider chooses direction by index comparison, not brittle path heuristics, so loops and hash routes behave correctly.
- Viewers remain generic and purely CSS-driven, gated by per-level view identity.

## Interaction with Browser History (Undo/Redo Analogy)

- The browser keeps a stack of entries and a cursor. Back moves the cursor left; Forward moves it right.
- `__vtIdx` mirrors the cursor position for our app session.
- On `pop`, we compare current vs previous cursor to know the movement direction. No separate redo stack is required; the browser’s own stack is the redo.

## API Surface

- __History Adapter__:
  - `start()`
  - `push(path: string)`
  - `replace(path: string)`
  - `redirect(path: string)`
  - `back()` (delegates to `window.history.back()`)
  - `current(): { path: string }`

- __Store__ (transitions):
  - `push(path)`
  - `replace(path)`
  - `pop(path)`

- __Viewer Props__:
  - `direction: 'forward' | 'back' | 'replace'`
  - `viewKey`, `prevViewKey`

## Key Implementation Details

- __Index seeding__: Done in the adapter `start()`. We write `__vtIdx` = 0 if missing.
- __Index persistence__: On push/replace we write state with `__vtIdx` preserved/updated, plus a random `key`.
- __Hash mode__: We normalize to a path string from `location.hash`; `hashchange` triggers a `pop` action just like `popstate`.
- __SSR/Reloads__: Index restarts at 0 on reload. Direction for the first navigation after reload still works because we compare indices only on `pop` events.

## Comparison to Established Libraries (2025)

- __history (React Router)__: Maintains a session index (`history.state.idx`) and emits an `action: PUSH|REPLACE|POP`. Our approach is equivalent: we maintain `__vtIdx`, emit `push|replace|pop`, and derive direction from the index.
- __TanStack Router__: Provides history abstractions with `go(n)`, `canGoBack`, etc. Direction semantics for animations are not built-in; when needed, a similar index-based approach is used to tell back vs forward on POP.

## Test Plan

Manual test path (covers most cases):
1. `home → about → products → 42 → specs` via links.
   - Expect forward animations.
   - Only changed scopes animate (e.g., tab level).
2. Hit Back 4× to return to `home`.
   - Each step animates back.
3. Hit Forward 4× to return to `specs`.
   - Each step animates forward (verify it’s not animating back).
4. Programmatic `replace` (e.g., login redirect):
   - Expect replace (non-directional) transition.
5. Toggle hash-only routes with `useHash: true` and repeat steps 1–3.

Enable temporary logs:
- `RouterProvider`: `[RouterProvider] { path, changeType, navDir }`.
- `SlideViewer`: per-level `viewKey/prevViewKey`, `scopeChanged`, `direction`.

## Debugging Tips

- If direction is wrong only on POP, check that `__vtIdx` changes across entries and that the provider compares current vs previous.
- If unrelated regions animate, ensure `Routes` emits correct `viewKey/prevViewKey` per level and `SlideViewer` gates on `scopeChanged`.
- If you see flicker, ensure both exit and entry are rendered concurrently and that exit remains mounted through the CSS animation duration.

## Future Enhancements

- Emit `direction` metadata directly from the adapter on POP (e.g., params on the change) to skip index reads in the provider.
- Dev overlay to visualize `navDir` and per-level `scopeChanged`.
- Integrate a small E2E test that simulates the full back/forward sequence.

## Relevant Files

- `src/router-history.ts` – maintains `__vtIdx`, dispatches `push|replace|pop`.
- `src/router-store.ts` – minimal state `{ path }`, transitions update path.
- `docs/src/code/examples/router/createRouter.tsx` – computes `from/to`, derives `navDir` from action and index compare, supplies context.
- `docs/src/code/examples/router/viewers.tsx` – `SlideViewer`; renders exit/entry simultaneously; CSS data-attrs for animations.
