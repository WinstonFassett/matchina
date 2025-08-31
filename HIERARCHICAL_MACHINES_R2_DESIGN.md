# Hierarchical Machines R2: Definitions, Flattening, and DX

Status: Draft (R2)
Scope: FactoryMachine only. Usage-first examples. Definition-first by default; instance path secondary.

## Goals

- Flatten nested machines into a single event namespace and fully-qualified state keys.
- Keep TypeScript autocomplete strong: staged arguments, no single-object inference traps.
- Support two parallel paths:
  - Definition-first (flattenable): static submachine definitions; best typing.
  - Instanceful (runtime HSM): real child machines with routing/propagation; secondary.
- Reduce ceremony: allow inline states (no mandatory `defineStates`).

## Terminology

- MachineDefinition (MD): `{ states, transitions, initial }` (types-only artifact).
- SubmachineDefinition (SMD): MD used only inside a parent MD’s `states`.
- Flattened MD: MD with fully-qualified leaf state keys (e.g., `On.Red`) and single event namespace.

## Public API (finalized)

- `defineMachine(states | statesFactory, transitions, initial)` → MD
  - Arg1 can be:
    - a `StatesFactory` (current `defineStates` result), or
    - a states shorthand object (see States Shorthand).
  - Rationale: staged inference; `transitions` completes against `keyof states`.

- `defineSubmachine(states | statesFactory, transitions, initial)` → SMD marker
  - Static-only. No factories/args. Not accepting `defineMachine` values.
  - For use only inside `defineMachine` states.

- `flattenMachineDefinition(def, opts?)` → MD (flattened)
  - Produces `{ states, transitions, initial }` where:
    - States are fully-qualified leaf keys.
    - Initial cascades to leaf (e.g., `On.Red`).
    - Events are hoisted to a single root namespace.
  - Options (future):
    - `delimiter?: string` (default: `"."`)

- `createMachine(states, transitions, initial)` → FactoryMachine (existing)
- `createMachineFrom(def)` → FactoryMachine
  - Convenience delegating to `createMachine(def.states, def.transitions, def.initial)`.

- `submachine(factory)` → state creator for instanceful HSM (secondary)
  - Alias/rename of `submachine` in `src/nesting/submachine.ts`.
  - Accepts only a machine factory `(...args) => FactoryMachine`.
  - Parameterization is instance-only.

- `machine.getInitialKey()` (small addition)
  - Expose initial state key used at creation time.

## States Shorthand (Arg1 of defineMachine)

Shorthand object where each key maps to one of:
- `undefined | true | {}` → simple state (no data)
- `() => any` → state creator returning data (current pattern)
- `defineSubmachine(...)` → nested static submachine (definition path)
- `submachine(() => machine)` → instanceful child (secondary; not flattenable)
- Implicit submachine shortcut (DX): `{ states, transitions, initial }` (treated as if wrapped by `defineSubmachine`)

Internally, we normalize shorthand to a `StatesFactory` so existing internals keep working.

## Example: Definition-first (flattenable)

```ts
const ctrlDef = defineMachine(
  {
    Off: undefined,
    On: defineSubmachine(
      { Red: undefined, Green: undefined, Yellow: undefined },
      { Red: { tick: "Green" }, Green: { tick: "Yellow" }, Yellow: { tick: "Red" } },
      "Red"
    ),
  },
  { Off: { repair: "On" }, On: { break: "Off" } },
  "Off"
);

const flat = flattenMachineDefinition(ctrlDef);
const ctrl = createMachineFrom(flat);
// ctrl.getState().key === "On.Red"
// ctrl.send("tick") -> "On.Green"
```

Equivalent using implicit submachine object:
```ts
const ctrlDef2 = defineMachine(
  {
    Off: true,
    On: {
      states: { Red: {}, Green: {}, Yellow: {} },
      transitions: { Red: { tick: "Green" }, Green: { tick: "Yellow" }, Yellow: { tick: "Red" } },
      initial: "Red",
    },
  },
  { Off: { repair: "On" }, On: { break: "Off" } },
  "Off"
);
```

## Example: Instanceful HSM (secondary)

```ts
const m = createMachine(
  {
    Off: undefined,
    On: submachine(() =>
      createMachine(
        { Red: undefined, Green: undefined, Yellow: undefined },
        { Red: { tick: "Green" }, Green: { tick: "Yellow" }, Yellow: { tick: "Red" } },
        "Red"
      )
    ),
  },
  { Off: { repair: "On" }, On: { break: "Off" } },
  "Off"
);
// setup(m)(propagateSubmachines(m)) for routed/child-first behavior
```

## Flattening Semantics

- State keys
  - DFS through definitions.
  - Parent `K` + child leaf `L` → `K.delimiter.L` (default `.`).
  - No parent-only leaves: every branch reduces to leaf states.

- Initial
  - Cascade by following `initial` at each nested level to reach a leaf key.

- Transitions
    - For each leaf state, combine applicable transitions:
      - Parent transitions that reference ancestor-level keys are retargeted to appropriate fully-qualified keys.
      - Child transitions map to fully-qualified targets under the same parent prefix.
    - Event collisions are resolved deterministically: the first transition encountered for a given
      (from, event) pair is kept. Because the flattener processes child-local transitions before
      applying parent-level retargeting, this means the lowest descendant (child) wins.

- Type inference
  - `defineMachine` remains 3-arg to preserve transitions autocomplete.
  - `flattenMachineDefinition` returns a typed MD with unions of flat state keys and hoisted events.

## State UX Enhancements (flat machines)

- `state.fullKey` (alias of `key` in flat mode)
- `state.is(k: string)` accepts:
  - ancestor (`"On"`), fully-qualified (`"On.Yellow"`), and leaf-name (`"Yellow"`).
- `state.match({ ... })` resolves most-specific-first (e.g., `"On.Yellow"` before `"On"`).

## Constraints and Non-Goals

- Definitions are static: `defineSubmachine` does not accept factories/args.
- Parameterization is instance-only via `submachine((...args) => machine)`.
- FactoryMachine-only scope; no StoreMachine changes here.

## Migration Notes

- Existing code using `defineStates` continues to work.
- You can drop `defineStates` by using the states shorthand in `defineMachine` and `createMachine`.
- For flattened DX, prefer `defineMachine` + `defineSubmachine` + `flattenMachineDefinition`.
- Keep instanceful HSM usage under `submachine` + `propagateSubmachines` for routed/child-first semantics.

## Testing Plan

- Traffic Light (Working/Broken) via definitions + flatten: events hoisted, keys fully-qualified, initial cascades.
- Collision policy: default error with readable diagnostics; success under `namespaced` option.
- `state.is` / `match` behavior for ancestor and qualified keys.
- Instanceful path remains green under current HSM tests.

## Implementation Plan (incremental)

1) Types and Shims
- Add `defineMachine` overload supporting states shorthand (normalize to `defineStates`).
- Implement `defineSubmachine` (static-only marker + normalization).
- Add `createMachineFrom(def)` small helper.
- Add `machine.getInitialKey()`.

2) Flattening Core (MVP)
- Implement `flattenMachineDefinition` with DFS:
  - collect fully-qualified leaf states
  - compute cascaded initial
  - retarget transitions and detect collisions

3) UX Helpers
- Implement `state.fullKey`, enhanced `state.is`/`match` for flat machines.

4) Docs & Examples
- Usage-first examples (Traffic Light Working/Broken).
- Dual-path guidance (definition-first vs instanceful).

## Open Questions (track)

- Do we add a read-only facade that presents flat keys over an instanceful HSM? (Migration helper)
- Default delimiter is `.`; any need for customization at per-level granularity?
