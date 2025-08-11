# Routes and Matchboxes: Compatibility Analysis

This note compares `defineRoutes` with a hypothetical/parallel `matchboxFactory` in the same spirit that we already have a compatibility story between `defineEffects` and `defineStates`.

The goal: clarify how typed route definitions (patterns, params, matching) map cleanly onto a composable "matchbox" abstraction so that routing can integrate with the wider Matchina patterns for machines, effects, and state.

## Concepts

- __defineRoutes__: Produces typed RouteBoxes from a map of path patterns. A RouteBox contains:
  - `pattern` (string): e.g. `/products/:id`
  - `to(params) -> string`: URL builder
  - `match(path) -> { params } | null`: single match
  - `matchAll(path) -> Array<RouteMatch>`: parent→child chain (optional)
  - `patterns` (record): original pattern map for introspection

- __matchboxFactory__ (proposed compatibility): Creates a composable box for matching/translating inputs to typed outputs, similar to how `defineEffects` composes effectful operations and `defineStates` composes state transitions.
  - Input: string path (or structured location)
  - Output: `{ name, params } | null` plus optional chain context
  - Extensible hooks: guards, loaders, transforms

## Why they align

- __Typed inputs/outputs__: Both yield strongly typed IO. `defineRoutes` encodes params from patterns; `matchboxFactory` encodes the same shape as its output contract.
- __Composition__: `matchboxFactory` composes guards/loaders/normalizers the same way `defineEffects` composes effects. `defineRoutes` provides the primitive match/to functions; the matchbox wraps and orchestrates them.
- __Determinism__: As with `defineStates`, matching is pure/deterministic given an input path and a route schema. Side-effects (guards/loaders) are layered outside.

## Compatibility Patterns

1. __Wrap defineRoutes in a matchbox__
   - Factory receives `routes = defineRoutes(patterns)`.
   - Produces an object with:
     - `match(path)` delegating to `routes.match(path)`
     - `matchAll(path)` delegating to `routes.matchAll(path)` when available
     - `to(name, params)` delegating to `routes[name].to(params)`
     - Optional middleware pipeline for guards/loaders/normalizers

2. __Guard/Loader as matchbox middleware__
   - `guard(ctx) -> true | redirectPath`
   - `loader(ctx) -> extraParams`
   - Middleware runs in order:
     - Normalize location (base/hash stripping)
     - `match(path)`
     - `guard` (can redirect)
     - `loader` (merge into params)

3. __Chain context__
   - `matchAll(path)` yields parent→child array. The matchbox surfaces this so React adapters (or other frameworks) can render nested layouts, breadcrumbs, etc.

4. __Search/Hash policy__
   - Consistent policy to strip or retain query/hash before `match`.
   - The matchbox can expose helpers to build full URLs: `composeUrl({ base, useHash }, internalPath, search, hash)`.

## Interop with defineEffects / defineStates

- __defineEffects__ parallel: the matchbox’s guard/loader pipeline mirrors effect composition—each step has a typed input and may return a transformed/augmented result or short-circuit (redirect).
- __defineStates__ parallel: the router store is a state machine (stack/index/current). The matchbox produces the deterministic next “matched state” for a given input path; the store transitions incorporate it as data.

## Minimal API Sketch

```ts
// Given
const routes = defineRoutes({
  Home: "/",
  Product: "/products/:id",
  ProductOverview: "/products/:id/overview",
} as const);

// Matchbox wrapper
type GuardCtx = {
  fullPath: string;
  path: string; // stripped of search/hash
  params: Record<string, unknown> | null;
  route: ReturnType<typeof routes.match>;
  chain?: ReturnType<typeof routes.matchAll>;
};

type LoaderCtx = Omit<GuardCtx, "fullPath">;

function matchboxFactory(opts: {
  routes: typeof routes;
  guard?: (ctx: GuardCtx) => true | string | Promise<true | string>;
  loader?: (ctx: LoaderCtx) => void | Record<string, unknown> | Promise<void | Record<string, unknown>>;
  base?: string;
  useHash?: boolean;
}) {
  const { routes, guard, loader, base = "", useHash = false } = opts;

  const strip = (s: string) => s.split(/[?#]/)[0] || "/";
  const normalize = (p: string) => (p.startsWith("/") ? p : `/${p}`);
  const fromLocation = () => {
    if (useHash) return normalize((window.location.hash || "#").slice(1) || "/");
    const raw = window.location.pathname + window.location.search + window.location.hash;
    return base && raw.startsWith(base) ? raw.slice(base.length) || "/" : raw;
  };

  async function resolve(fullPath: string) {
    const path = strip(fullPath);
    const inst = routes.match(path);
    const route = inst;
    const chain = routes.matchAll?.(path) ?? (route ? [route] : []);

    if (guard) {
      const decision = await guard({ fullPath: fullPath, path, params: inst?.params ?? null, route, chain });
      if (typeof decision === "string") return { redirect: decision } as const;
    }

    let params = inst?.params ?? null;
    if (loader) {
      const extra = await loader({ path, params, route, chain });
      if (extra && typeof extra === "object") params = { ...(params ?? {}), ...extra };
    }

    return { match: inst ?? null, params, chain } as const;
  }

  return {
    to: <N extends keyof typeof routes & string>(name: N, params: any) => routes[name].to(params),
    match: (path: string) => routes.match(path),
    matchAll: (path: string) => routes.matchAll?.(path) ?? [],
    resolve,
    fromLocation,
  };
}
```

## Migration Guidance

- __From defineRoutes only → matchbox__
  - Keep your patterns and route names identical.
  - Wrap with `matchboxFactory` to gain guard/loader and URL normalization.
  - Update adapters to use `resolve()` for guard/loader-aware navigation; still use `to()` for URL building.

- __From custom router → defineRoutes + matchbox__
  - Replace ad-hoc regex with `defineRoutes` for typed params.
  - Use matchbox resolve pipeline for redirects, data, and chain-aware rendering.

## Testing Strategy

- Unit test `compilePattern()` correctness (root `/`, param segments, no double-slashes).
- Unit test `match()` and `matchAll()` for nested routes.
- Integration test `resolve()` with guard redirects and loader merges.
- E2E test URL→view synchronization (hash/base), ensuring immediate UI update on navigation.

## Summary

- `defineRoutes` supplies the typed, deterministic matching and URL building primitives.
- A `matchboxFactory` wraps those primitives into a composable pipeline that mirrors Matchina’s `defineEffects` and `defineStates` philosophy.
- This alignment makes routing a first-class citizen in the Matchina ecosystem while preserving strong typing and predictable behavior.
