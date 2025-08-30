# Hierarchical Machines Design (matchina)

## Findings

* __Primitives in place__
  * `createMachine()` in `src/factory-machine.ts` with lifecycle via `withLifecycle()` in `src/event-lifecycle.ts`.
  * `createStoreMachine()` in `src/store-machine.ts` with direct/curried transitions (good for Immer).
  * Event API helpers in `src/factory-machine-event-api.ts`.
* __Task doc alignment__ (`HIERARCHICAL_MACHINES_TASK.md`)
  * Scopes, deterministic bubbling (child → parent).
  * Composition patterns: orthogonal regions, state-indexed child, stacked chain.
  * Router naturally maps to stacked chain.

## Goal

Add a small, generic HSM runtime that:
* Manages a hierarchy (stack/chain) of child machines.
* Dispatches events deepest-first with bubbling to parents.
* Supports retention policy (keep/dispose children).
* Works with ~~both~~ `FactoryMachine` ~~and `StoreMachine`~~.
* Keeps typings simple and compatible.

## Usage (lead)

This is the recommended, minimal way to declare a hierarchical machine with strong type inference. It keeps authoring simple and removes `as any`.

```ts
// child.ts
import { createMachine } from "./src/factory-machine";
import { defineStates } from "./src/define-states";

export function createChild() {
  const states = defineStates({ Idle: undefined, Executing: undefined });
  return createMachine(
    states,
    {
      Idle: { start: "Executing" },
      Executing: {},
    },
    "Idle"
  );
}

export type Child = ReturnType<typeof createChild>; // precise child type
```

```ts
// parent.ts
import { createMachine } from "./src/factory-machine";
import { defineStates } from "./src/define-states";
import { setup } from "./src/ext/setup";
import { propagateSubmachines } from "./playground/propagateSubmachines";
import { createChild, type Child } from "./child";

export function createParent() {
  const states = defineStates({
    Idle: undefined,
    // The key is precise typing of data.machine → Child
    First: () => ({ machine: createChild() as Child }),
    Done: undefined,
  });

  const parent = createMachine(
    states,
    { Idle: { toFirst: "First" }, First: { done: "Done" }, Done: {} },
    "Idle"
  );

  // Child-first routing is applied via an enhancer helper
  setup(parent)(propagateSubmachines(parent));
  return parent;
}

// Usage
const parent = createParent();
parent.send("toFirst");
const child = parent.getState().as("First").data.machine; // typed as Child
child.send("start"); // fully typed
```

Why this infers well:
* __Child type is concrete__: `type Child = ReturnType<typeof createChild>`.
* __State data is annotated__: `First: () => ({ machine: createChild() as Child })`.
* __No any casts in tests or app code__: `child.getState()` and `child.send()` are typed.

Alternative declaration (factory in enter/leave):
* Create child in parent’s `enter` and dispose in `leave` while storing it on a shared field with type `Child`. The routing helper works the same; just ensure teardown is handled in `leave`.

## Conventions for configuring/detecting/using/composing

These are realistic, feasible options. Pick A as default; the rest are opt‑in.

* __[A] Embedded child (default)__
  * Where: `state.data.machine` in state factory (or `enter`).
  * Detect: brand-first `isMachine(x)`, fallback duck-typing `{ getState, send }`.
  * Route: child-first via enhancer on parent’s `send` + `resolveExit` probe.
  * Pros: smallest surface, best TS, easy to reason about.

* __[B] Composer facade (opt‑in, future)__
  * `composeDeep(parent)` returns a facade that unifies `.send()` across active child.
  * Handles event name conflicts by namespacing or warnings.
  * Pros: ergonomic single entry point. Cons: adds abstraction and type plumbing.

* __[C] Deep utilities (opt‑in, future)__
  * `getStateDeep(parent)` and `sendDeep(parent, type, ...params)`.
  * Improves inspection and routing ergonomics without changing the parent API.
  * Pros: minimal, incremental. Cons: weaker typing unless narrowed by active state.

## Real-world example: Traffic Light (Working/Broken)

Goal: A top-level machine `SignalController` with states `Working` and `Broken`.
When entering `Working`, it creates a child `TrafficLight` machine (`Red → Green → Yellow` on `tick`).

### Child machine

```ts
// traffic-light.ts
import { createMachine } from "./src/factory-machine";
import { defineStates } from "./src/define-states";

export function createTrafficLight() {
  const states = defineStates({ Red: undefined, Green: undefined, Yellow: undefined });
  return createMachine(
    states,
    {
      Red:   { tick: "Green"  },
      Green: { tick: "Yellow" },
      Yellow:{ tick: "Red"    },
    },
    "Red"
  );
}
export type TrafficLight = ReturnType<typeof createTrafficLight>;
```

### Parent machine with embedded child

```ts
// signal-controller.ts
import { createMachine } from "./src/factory-machine";
import { defineStates } from "./src/define-states";
import { setup } from "./src/ext/setup";
import { propagateSubmachines } from "./playground/propagateSubmachines";
import { createTrafficLight, type TrafficLight } from "./traffic-light";

export function createSignalController() {
  const states = defineStates({
    Working: () => ({ machine: createTrafficLight() as TrafficLight }),
    Broken:  undefined,
  });

  const machine = createMachine(
    states,
    {
      Working: { break: "Broken" },
      Broken:  { repair: "Working" },
    },
    "Working"
  );

  setup(machine)(propagateSubmachines(machine));
  return machine;
}
export type SignalController = ReturnType<typeof createSignalController>;
```

### Usage patterns (ergonomics)

1) __Raw child usage (explicit, powerful)__

```ts
const ctrl = createSignalController();
// Explicitly operate on the child when in Working
ctrl.getState().match({
  Working: (s) => s.data.machine.send("tick"),
  _: () => {}
});
```

Pros: maximal clarity; child API is fully typed. Cons: one extra unwrap.

2) __Parent-only events with child-first routing (minimal app code)__

```ts
const ctrl = createSignalController();
// App only talks to the parent
ctrl.send("tick"); // routed to child when Working
ctrl.send("break"); // handled by parent → transitions to Broken
```

Pros: simplest surface; app ignores hierarchy details. Cons: parent event names must include child events (shared "tick").

3) __Optional facade (opt‑in)__

```ts
// Pseudo-code; not part of the core
const mega = composeDeep(ctrl); // future
mega.send("tick");            // routed
const state = mega.getStateDeep(); // { key: 'Working', child: { key: 'Green' } }
```

Pros: single entry point; future-friendly. Cons: extra abstraction; out of v1 scope.

Takeaway: You can pick (1) explicit child calls or (2) parent-only sends. Both are fully supported and typed today with the embedded-child pattern.

## Current Implementation (v1): Embedded helper on FactoryMachine

* __Pattern__: A parent state “HAS a machine” at `state.data.machine`.
* __Detection__: Prefer brand guard `isMachine(x)`; fallback to duck-typing `x && typeof x.getState==='function' && typeof x.send==='function'` for interop during transition.
* __Routing__: Child-first via lifecycle/method enhancers.
  * Pre-handle probe with `resolveExit` if available.
  * Otherwise snapshot child state before/after to detect handling.
  * If child handled, abort parent handling; else let parent continue.
  * Implemented by `playground/propagateSubmachines.ts` using `enhanceMethod()` on `send` and `dispatch` (dispatch supported for interop).
* __Scope__: v1 targets `FactoryMachine`. Hierarchical stores are out of scope.
* __Hierarchy propagation__: Apply the same helper on any child machine instance; deep routing emerges naturally without explicit recursion in the helper.
* __Typing guidance__: Avoid `as any` by typing the child instance in the state data (see “Hierarchy Declaration and Typing”).

## Parent-only events: policy

Parent-only sends are ergonomic, but they shouldn’t be required.

* __Allowed__: App can choose to send only to the parent (`ctrl.send("tick")`) and rely on child-first routing.
* __Allowed__: App can also explicitly target the child when it needs control (`ctrl.getState().as("Working").data.machine.send("tick")`).
* __Recommendation__: Start projects with parent-only sends for simplicity; drop to explicit child calls when behavior needs to be local.

Implication for API design: keep both paths first-class and typed. Do not force a single surface.

## Path matching (desired)

We want a readable way to match nested active states (paths) with strong typing.

Usage-first proposal (playground helper, future):

```ts
// Typed path matching (concept)
ctrl.getState().pathMatch({
  "Working/Red":   () => /* ... */,
  "Working/Green": () => /* ... */,
  "Broken":        () => /* ... */,
  _: () => {}
});
```

Notes:
* Paths are derived from parent + child tags (e.g., `Working` × `Red|Green|Yellow`).
* We can compute valid path keys with template-literal types.
* For v1, keep this as a doc’d direction and a playground enhancer once the hierarchy structure is finalized.

## Compose machines (preferred) vs bare substates

Composing machines is generally more compelling than declaring bare substates: the child brings its own transitions, nested states, and events. The parent embeds the child at a state boundary.

Recommended authoring:

```ts
// Compose machine into a parent state
const powerStates = defineStates({
  Off: undefined,
  On: () => ({ machine: createTrafficLight() as TrafficLight })
});
```

Alternate syntactic sugar (future, same semantics):

```ts
// submachine: wraps a child factory
const powerStates = defineStates({
  Off: undefined,
  On: submachine(() => createTrafficLight()),
});
```

Either way, the runtime remains “state HAS a machine” with child-first routing.

## API sketches (usage-first, future)

All FactoryMachine-only.

* __submachine(createChild)__
  - Input: `() => ChildMachine`
  - Expands to state factory: `() => ({ machine: createChild() })`
  - Types: infers `Child` and applies to `state.data.machine`

* __composeMachines(parent, options?)__
  - Optional helper that configures parent-only routing and (later) conflict policy.
  - Start minimal: just calls `setup(parent)(propagateSubmachines(parent))`.

* __pathMatch(state, mapping)__ (enhancer on state snapshot)
  - Keys: typed path strings derived from configured parent/child tags
  - Behavior: invokes handler for the active path; supports `_` default

We will keep these as design targets until we finalize structure and tests.

## Core Concepts

* __Scope__: identifier for a hierarchical position (e.g., route segment or logical scope id).
* __Node__: `{ scope: string; machine: AnyMachine; snapshot?: unknown }`.
* __Hierarchy__: ordered chain from root to deepest active child.

## Future Work: Minimal API (new file `src/hierarchical-machine.ts`)

```ts
// Common machine surface
export type AnyMachine = {
  getState(): any;
  // FactoryMachine only for v1
  resolveExit?(ev: any): any | undefined;
  send?(type: string, ...params: any[]): void;
};

export type HierMachineNode<M extends AnyMachine = AnyMachine> = {
  scope: string;
  machine: M;
  snapshot?: unknown;
};

export type HierSnapshot = {
  chain: Array<{ scope: string; state: any }>;
  meta?: any;
};

export type RetainPolicy =
  | { keep: number }
  | { predicate: (scope: string, idx: number) => boolean };

export interface HierMachine {
  getSnapshot(): HierSnapshot;
  getChain(): HierMachineNode[];
  ensureChain(scopes: string[]): void;
  dispatch(type: string, ...params: any[]): { handled: boolean };
  unmountBeyond(depth: number): void;
}

export function createHierMachine(
  registry: Record<string, () => AnyMachine>,
  options?: { retain?: RetainPolicy; onResolveChild?: (scope: string, type: string, params: any[]) => boolean }
): HierMachine;
```

### Behavior

* __ensureChain(scopes)__
  * Mount or reuse machines for each `scope` in order.
  * Apply retention policy to nodes beyond active depth.
* __dispatch(type, ...params)__
  * Iterate from deepest node to root.
  * For `FactoryMachine`:
    * Probe with `resolveExit({ type, params, from: getState() })`.
    * If non-undefined, execute by `send(type, ...params)` and stop.
  * For `StoreMachine`:
    * Non-mutating probe via `resolveExit` (see below). If it would change, call `dispatch(type, ...params)` and stop.
  * If nobody handles, return `{ handled: false }`.
* __unmountBeyond(depth)__
  * Dispose nodes beyond `depth` unless retained by policy.

## Event Routing and Bubbling

* __Local-first__: deepest child → parent → … → root.
* __Deterministic__: single pass, first handler wins.
* __Optional hook__: `onResolveChild(scope, type, params)` to intercept before sending to a child.

## Retention Policy

* `{ keep: N }`: keep last N nodes’ snapshots beyond active depth; unmount others (optionally call `dispose()` if machine exposes it).
* `{ predicate(scope, idx) }`: custom keep/dispose logic.

## Integration Points

* __Router chain__
  * Subscribe to route changes; compute chain of scopes (e.g., `Products → Product → ProductOverview`).
  * `ensureChain(scopes)` on navigation; prune using retention policy.
  * Registry maps scope → `() => Machine`. Paramized routes can pass params into the machine factory.
* __Immer__
  * Existing direct and curried patterns in `StoreMachine` remain valid; HSM layer is orthogonal.

## File Layout

* New: `src/hierarchical-machine.ts`
  * Exports `createHierMachine`, `HierMachine`, `RetainPolicy`, common types.
* Optional: `src/integrations/router-hsm.ts`
  * `attachRouter(hsm, getRouteChain, options)` helper to keep chain in sync with the router.

## Step-by-Step Plan

1) __Probe support__
   * Factory: use existing `resolveExit()`.
   * Store: implement `resolveExit()` (non-mutating) to mirror factory probing.

2) __Implement `src/hierarchical-machine.ts`__
   * Maintain `nodes: HierMachineNode[]`.
   * `ensureChain(scopes)` mounts/prunes.
   * `dispatch()` probes deepest-first, executes first handler, wraps with `withLifecycle` for hooks.

3) __Docs examples__
   * Non-routing traffic light HSM (see below).
   * Router-chain demo wiring with `createHierMachine()`.

## StoreMachine: add `resolveExit()`

Add a non-mutating probe so HSM can unify handling:

```ts
// In src/store-machine.ts
resolveExit(ev: StoreChange<T>): StoreChange<T> | undefined
```

Implementation sketch: use existing transition resolver without mutating; return `undefined` if no handler or next equals `from`.

## Example APIs (concise)

```ts
// src/hierarchical-machine.ts
export type AnyMachine = {
  getState(): any;
  resolveExit?(ev: any): any | undefined;
  send?(type: string, ...params: any[]): void;
  dispatch?(type: string, ...params: any[]): void;
};

export interface HierMachine {
  getSnapshot(): { chain: Array<{ scope: string; state: any }> };
  getChain(): Array<{ scope: string; machine: AnyMachine }>; 
  ensureChain(scopes: string[]): void;
  dispatch(type: string, ...params: any[]): { handled: boolean };
  unmountBeyond(depth: number): void;
}

export function createHierMachine(
  registry: Record<string, () => AnyMachine>,
  options?: { retain?: { keep: number } | { predicate: (scope: string, idx: number) => boolean } }
): HierMachine;
```

## Non-routing example (Traffic Light HSM)

Sketch-style behavior:
* Root states: `Powered` and `Unpowered`.
* When `Powered`: child cycles `Green → Yellow → Red` on `tick`.
* When `Unpowered`: child blinks `RedOn ↔ RedOff` on `tick`.

Model as stacked chain scopes:
* `Powered` scope uses `LightCycleMachine` (Green/Yellow/Red).
* `Unpowered` scope uses `BlinkMachine` (RedOn/RedOff).
* Chain examples:
  * `["Powered", "Green"]` → tick handled by child → `"Yellow"`.
  * `["Unpowered", "RedOn"]` → tick handled by child → `"RedOff"`.

## Open Questions

* Include orthogonal regions in v1, or ship stacked chain first? (Recommend stacked chain first.)
* OK to expose `StoreMachine.resolveExit()` for unified probing?

## Recommended Actions

* __Ship v1 scope__
  * Stacked chain only.
  * Implement `src/hierarchical-machine.ts`.
  * Add `StoreMachine.resolveExit()` (non-mutating probe).
  * Add traffic-light example and a router-chain demo.

## Chosen Semantics: Embedded Hierarchy (state HAS a machine)

* __Parent-state convention__
  * A state is hierarchical iff `state.data?.machine` exists and is a machine.
  * The child’s substate is accessed at `state.data.machine.getState()`.

* __Event routing (child-first)__
  * On any event to the parent machine, first attempt to send it to `state.data.machine`.
  * If the child changes state (handled), the parent does nothing (abort parent handling).
  * If the child does not change, the parent handles the event normally.

* __Hierarchy declaration and typing__
  * Define the child factory first and capture its type.
    * Example: `type Child = ReturnType<typeof createChild>` or capture `const Child = createChild();` for `typeof Child`.
  * In `defineStates`, type the parent state’s `data.machine` precisely to the child type to enable typed `getState()`/`send()` on the child and remove `as any`.
    * Example: `First: () => ({ machine: createChild() as Child })`.
  * Alternatively, if constructing in `enter`, ensure `leave` disposes and keep a shared field with the captured child type.

* __Deep hierarchy__
  * Apply the same lifecycle wiring to every machine instance you want hierarchical behavior on.
  * If a child’s current state also has a `data.machine`, its own hook will route further down—no explicit recursion required.

* __Branding and type guards (functional, no instanceof)__
  * Introduce a non-enumerable brand symbol at machine construction time, e.g. `MATCHINA_MACHINE = Symbol('matchina.machine')`.
  * Attach via `Object.defineProperty(machine, MATCHINA_MACHINE, { value: true })` inside machine factories.
  * Public predicates:
    * `isMachine(x): x is AnyMachine`
    * Optionally `isFactoryMachine(x)`, `isStoreMachine(x)` for subtype checks.
  * Hierarchical detection helper: `isHierarchicalState(state) => isMachine(state?.data?.machine)`.
  * __Fallback__: Allow duck-typed detection `{ getState, send|dispatch }` to interoperate while branding is rolled out or when composing external machines.

* __Implementation vehicle (no core changes required)__
  * Use lifecycle `handle` hook to implement child-first routing.
  * Minimal helper (applied with `setup(machine)(handle(...))`) can snapshot child state before/after to infer handling.
  * Later, switch helper to branded `isMachine` checks once branding lands.

* __Creation/teardown policy__
  * Child machine creation can occur either in the parent state factory or in the parent `enter` hook; teardown in `leave`.
  * Examples will show state-factory creation to mirror prior patterns; both approaches are compatible with routing.

## Summary

Minimal HSM runtime that composes existing machines, adds deterministic bubbling and retention, and maps 1:1 to router/viewer architecture. Small surface, type-friendly, and practical.
