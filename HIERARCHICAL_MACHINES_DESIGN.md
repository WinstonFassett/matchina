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
* Works with both `FactoryMachine` and `StoreMachine`.
* Keeps typings simple and compatible.

## Core Concepts

* __Scope__: identifier for a hierarchical position (e.g., route segment or logical scope id).
* __Node__: `{ scope: string; machine: AnyMachine; snapshot?: unknown }`.
* __Hierarchy__: ordered chain from root to deepest active child.

## Minimal API (new file `src/hierarchical-machine.ts`)

```ts
// Common machine surface
export type AnyMachine = {
  getState(): any;
  // FactoryMachine
  resolveExit?(ev: any): any | undefined;
  send?(type: string, ...params: any[]): void;
  // StoreMachine
  dispatch?(type: string, ...params: any[]): void;
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

* __Implementation vehicle (no core changes required)__
  * Use lifecycle `handle` hook to implement child-first routing.
  * Minimal helper (applied with `setup(machine)(handle(...))`) can snapshot child state before/after to infer handling.
  * Later, switch helper to branded `isMachine` checks once branding lands.

* __Creation/teardown policy__
  * Child machine creation can occur either in the parent state factory or in the parent `enter` hook; teardown in `leave`.
  * Examples will show state-factory creation to mirror prior patterns; both approaches are compatible with routing.

## Summary

Minimal HSM runtime that composes existing machines, adds deterministic bubbling and retention, and maps 1:1 to router/viewer architecture. Small surface, type-friendly, and practical.
