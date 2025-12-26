# Matchina Design Analysis: Open Concerns

**Date**: 2024-12-25  
**Status**: Design Analysis (Pre-Implementation)  
**Goal**: Resolve 4 open design concerns before creating implementation tickets

---

## Executive Summary

After deep analysis of the codebase and design goals, I propose:

1. **Manifest**: Minimal `MachineManifest` interface attached at creation, XState-compatible shape
2. **`.extend()`**: Simple `extend<T>(fn: (m) => T): T` that returns whatever the function returns
3. **HSM Reconciliation**: Flattening is the primary API; propagation becomes `matchina/hsm/propagate` (experimental, separate entry)
4. **Type Efficiency**: Defer to post-merge; focus on removing `any` from type definitions first

---

## Design Goals (Constraints)

From user preferences and AGENTS.md:

| Goal | Implication |
|------|-------------|
| Make it work, don't get fancy | Simple solutions over clever ones |
| Tree-shakeable, à la carte | No monolithic wrappers |
| Good TS support is most important | Types must be sound and performant |
| Flattening feels more algebraic | Prefer static analysis over runtime traversal |
| Viz should not mandate React | Manifest must be framework-agnostic |
| Verbs are good for function names | `createMachine`, `defineStates`, `flattenMachine` |

---

## Concern 1: Manifest/Instrumentation for Viz

### The Problem

Visualizers need to know "what a machine is" without running it:
- States and their hierarchy
- Transitions (from → event → to)
- Initial state
- Final states (optional)

Currently:
- `getXStateDefinition()` exists in docs only
- Requires runtime machine instance
- Fragile for HSM (depends on `.def` attachment pattern)
- No standard format

### Analysis

**What visualizers actually consume** (from `matchina-machine-to-xstate-definition.ts`):

```typescript
{
  initial: string,
  states: {
    [key: string]: {
      key: string,
      fullKey: string,
      on: { [event: string]: string },
      initial?: string,      // for nested
      states?: { ... },      // for nested
      stack?: StateStack[]
    }
  }
}
```

This is essentially XState's format, which makes sense for tooling compatibility.

**Key insight**: The machine already has `states` and `transitions` on it. The "manifest" is just a read-only view of these, possibly with hierarchy parsed from dot-keys.

### Alternatives

#### Option A: Attach manifest at creation time

```typescript
interface MachineManifest {
  initial: string;
  states: Record<string, {
    on: Record<string, string>;
    initial?: string;
    states?: MachineManifest['states'];
  }>;
}

// Attached automatically
machine.manifest: MachineManifest
```

**Pros**: Always available, no runtime computation  
**Cons**: Increases machine object size, must be kept in sync

#### Option B: Lazy computation via getter

```typescript
Object.defineProperty(machine, 'manifest', {
  get() { return computeManifest(this); }
});
```

**Pros**: No storage overhead, always fresh  
**Cons**: Computed on every access (could cache)

#### Option C: Separate function in `matchina/inspect`

```typescript
import { getManifest } from 'matchina/inspect';
const manifest = getManifest(machine);
```

**Pros**: Tree-shakeable, explicit opt-in  
**Cons**: Extra import, not discoverable on machine

#### Option D: Extension pattern

```typescript
import { withManifest } from 'matchina/inspect';
const machine = createMachine(...).extend(withManifest);
// machine.manifest now exists
```

**Pros**: Composable, tree-shakeable  
**Cons**: Must remember to extend

### Evaluation

| Option | Tree-shake | Discoverable | Always Fresh | Complexity |
|--------|------------|--------------|--------------|------------|
| A: Attach at creation | ❌ | ✅ | ❌ (snapshot) | Low |
| B: Lazy getter | ❌ | ✅ | ✅ | Low |
| C: Separate function | ✅ | ❌ | ✅ | Low |
| D: Extension | ✅ | ✅ (after extend) | ✅ | Medium |

### Recommendation: Option C (Separate function)

**Rationale**:
- Aligns with "à la carte" philosophy
- Visualizers already import from somewhere; one more import is fine
- Keeps core machine lean
- Function can handle both flat and hierarchical machines

**Proposed API**:

```typescript
// matchina/inspect
export function getManifest(machine: FactoryMachine): MachineManifest;

// For flattened machines, parse dot-keys into hierarchy
export function getHierarchicalManifest(machine: FactoryMachine): MachineManifest;

// Type
export interface MachineManifest {
  initial: string;
  states: Record<string, StateManifest>;
}

export interface StateManifest {
  on: Record<string, string>;
  initial?: string;
  states?: Record<string, StateManifest>;
  final?: boolean;
}
```

**For flattened machines**: `getHierarchicalManifest` parses `Working.Red` into nested structure.

**For propagated machines**: `getManifest` walks active chain (runtime-dependent, but that's inherent to propagation).

---

## Concern 2: `.extend()` Type Signature

### The Problem

Need to replace `matchina()` with composable extensions. Current `matchina()` does:

```typescript
export function matchina(...) {
  return assignEventApi(createMachine(states, transitions, init));
}
```

Where `assignEventApi` adds event methods directly to machine:

```typescript
export function assignEventApi<M extends FactoryMachine<any>>(machine: M) {
  return Object.assign(machine, eventApi(machine));
}
```

### Analysis

**What extensions need to do**:
1. Add properties/methods to machine (`withEventApi` adds `.activate()`, `.deactivate()`, etc.)
2. Wrap behavior (`withLogging` could wrap `send`)
3. Return enhanced type

**Key constraint**: Must compose well with TypeScript inference.

### Alternatives

#### Option A: Simple function application

```typescript
// On machine
extend<T>(fn: (machine: this) => T): T

// Usage
const machine = createMachine(...)
  .extend(withEventApi)
  .extend(withSubscribe);
```

**Implementation**:
```typescript
// In FactoryMachine
extend<T>(fn: (machine: this) => T): T {
  return fn(this);
}
```

**Pros**: Dead simple, full type inference  
**Cons**: Each extension must return the enhanced machine

#### Option B: Mixin-style with intersection

```typescript
extend<E>(fn: (machine: this) => E): this & E

// Usage
const machine = createMachine(...)
  .extend(m => ({ api: eventApi(m) }))
  .extend(m => ({ reset: () => m.send('reset') }));
```

**Pros**: Additive, clear what's being added  
**Cons**: Extensions must return object to merge, not full machine

#### Option C: Builder pattern

```typescript
interface MachineBuilder<M> {
  with<E>(ext: Extension<M, E>): MachineBuilder<M & E>;
  build(): M;
}

createMachine(...).with(eventApi).with(subscribe).build()
```

**Pros**: Explicit build step  
**Cons**: Extra complexity, deferred creation

#### Option D: Pipe/compose utility

```typescript
import { pipe } from 'matchina';
const machine = pipe(
  createMachine(states, transitions, init),
  withEventApi,
  withSubscribe
);
```

**Pros**: Functional style, no method on machine  
**Cons**: Less discoverable, variadic generics are hard

### Evaluation

| Option | TS Inference | Simplicity | Discoverability | Composability |
|--------|--------------|------------|-----------------|---------------|
| A: Simple fn | ✅ | ✅ | ✅ | ✅ |
| B: Mixin | ⚠️ (intersection) | ⚠️ | ✅ | ✅ |
| C: Builder | ✅ | ❌ | ⚠️ | ✅ |
| D: Pipe | ⚠️ (variadic) | ⚠️ | ❌ | ✅ |

### Recommendation: Option A (Simple function application)

**Rationale**:
- Simplest possible implementation
- TypeScript infers return type naturally
- Each extension is just a function `(machine) => enhancedMachine`
- Chains naturally

**Proposed Implementation**:

```typescript
// In factory-machine.ts, add to FactoryMachine interface
interface FactoryMachine<FC> {
  // ... existing ...
  
  /**
   * Apply an extension function to this machine.
   * The extension receives the machine and returns an enhanced version.
   */
  extend<T>(fn: (machine: this) => T): T;
}

// Implementation in createMachine
const machine = {
  // ... existing ...
  extend(fn) {
    return fn(this);
  }
} as FactoryMachine<FC>;
```

**Extension examples**:

```typescript
// withEventApi - adds event methods
export function withEventApi<M extends FactoryMachine<any>>(machine: M) {
  return Object.assign(machine, eventApi(machine));
}

// withReset - adds reset method
export function withReset<M extends FactoryMachine<any>>(machine: M) {
  const initialState = machine.getState();
  return Object.assign(machine, {
    reset: () => machine.send('__reset' as any) // or direct state set
  });
}

// Usage
const machine = createMachine(states, transitions, 'Idle')
  .extend(withEventApi)
  .extend(withReset);

machine.activate(); // from withEventApi
machine.reset();    // from withReset
```

**Migration from `matchina()`**:

```typescript
// Old
const machine = matchina(states, transitions, 'Idle');

// New
const machine = createMachine(states, transitions, 'Idle')
  .extend(withEventApi);

// Or create a convenience wrapper
export const matchina = (s, t, i) => createMachine(s, t, i).extend(withEventApi);
```

---

## Concern 3: HSM Flattening vs Propagation Reconciliation

### The Problem

Two HSM approaches exist:
1. **Flattening** (`definitions.ts`): Static, compile-time, ~150 lines
2. **Propagation** (`propagateSubmachines.ts`): Dynamic, runtime, ~375 lines

Decision made: Both kept, flattening primary. But how do they coexist?

### Analysis

**Flattening characteristics**:
- Transforms nested definition into flat state keys (`Working.Red`)
- All states known at definition time
- Single machine instance
- Transitions are rewritten to use qualified keys
- Type inference is challenging but static

**Propagation characteristics**:
- Runtime child machine discovery
- Each nested state has its own machine instance
- Events bubble up/down through hierarchy
- `child.exit` synthesized when child reaches final state
- Complex runtime behavior, harder to reason about

**Key insight**: These are fundamentally different mental models.

| Aspect | Flattening | Propagation |
|--------|------------|-------------|
| When hierarchy is known | Definition time | Runtime |
| Number of machines | 1 | N (one per level) |
| State identity | `"Working.Red"` | `{ parent: "Working", child: "Red" }` |
| Event routing | Direct (flat transitions) | Bubbling (child-first) |
| Visualization | Parse dot-keys | Walk active chain |
| Complexity | Low | High |

### Alternatives for Coexistence

#### Option A: Completely separate APIs

```
matchina/hsm/flatten   → flattenMachineDefinition, defineSubmachine
matchina/hsm/propagate → propagateSubmachines, createHierarchicalMachine
```

No shared code. User picks one approach.

**Pros**: Clean separation, no confusion  
**Cons**: Duplication if there's shared logic

#### Option B: Shared definition, different execution

```typescript
// Same definition format
const def = defineMachine(states, transitions, 'Init');

// Different execution strategies
const flat = createFlatMachine(def);      // Flattening
const hier = createHierarchicalMachine(def); // Propagation
```

**Pros**: Single definition format  
**Cons**: Propagation doesn't use definitions the same way

#### Option C: Flattening primary, propagation as escape hatch

```
matchina/hsm           → Flattening (primary)
matchina/hsm/propagate → Propagation (experimental, opt-in)
```

Flattening is the "blessed" path. Propagation exists for edge cases.

**Pros**: Clear recommendation, reduces confusion  
**Cons**: Propagation users feel second-class

### Evaluation

| Option | Clarity | Maintenance | User Guidance |
|--------|---------|-------------|---------------|
| A: Separate | ✅ | ⚠️ (two codebases) | ⚠️ (which to use?) |
| B: Shared def | ⚠️ | ⚠️ | ⚠️ |
| C: Primary/escape | ✅ | ✅ | ✅ |

### Recommendation: Option C (Flattening primary, propagation escape hatch)

**Rationale**:
- Aligns with user preference ("flattening feels more algebraic")
- Flattening is simpler, more predictable
- Propagation is complex (375 lines) and has been "a PITA"
- Clear guidance reduces user confusion

**Proposed Structure**:

```
matchina/hsm
  ├── index.ts          → Re-exports flattening API
  ├── flatten.ts        → flattenMachineDefinition, defineSubmachine, etc.
  └── propagate.ts      → propagateSubmachines (marked experimental)
```

**API**:

```typescript
// Primary (flattening)
import { flattenMachineDefinition, defineSubmachine } from 'matchina/hsm';

// Escape hatch (propagation)
import { propagateSubmachines } from 'matchina/hsm/propagate';
// or
import { propagateSubmachines } from 'matchina/hsm'; // also exported, but docs emphasize flattening
```

**Documentation emphasis**:
- Tutorials use flattening
- Propagation documented as "advanced/experimental"
- Clear guidance on when to use each

**Manifest implications**:
- Flattening: `getHierarchicalManifest` parses dot-keys
- Propagation: `getManifest` walks active chain (inherently runtime-dependent)

---

## Concern 4: Type Efficiency

### The Problem

Complex types may slow down IDE/compiler:
- Template literal types for flattening (`"Parent.Child"`)
- Recursive types for HSM
- `any` in type definitions

### Analysis

**Current type complexity sources** (from `definition-types.ts`):

1. `FlattenFactoryStateKeys<F>` - Template literal union
2. `FlattenedFactoryStateSpecs<F>` - Mapped type with conditionals
3. `ExtractMachineFromFactory<V>` - Nested conditional extraction

**`any` usage in type definitions** (needs audit):
- `FactoryMachineTransition` uses `any` for params
- `FlatBuild` uses `Record<string, any>`
- Various internal types

### Recommendation: Defer detailed analysis, fix `any` first

**Rationale**:
- TypeSlayer analysis is a separate task requiring tooling setup
- Fixing `any` in type definitions is actionable now
- Type performance is post-merge work

**Immediate action** (pre-merge):
1. Audit type definition files for `any`
2. Replace with `unknown` or proper types where possible
3. Document remaining gaps

**Post-merge action**:
1. Run TypeSlayer
2. Identify specific bottlenecks
3. Simplify if needed

---

## Synthesis: Coherent Design

### How the pieces fit together

```
┌─────────────────────────────────────────────────────────────┐
│                        User Code                            │
├─────────────────────────────────────────────────────────────┤
│  const machine = createMachine(states, transitions, init)   │
│    .extend(withEventApi)                                    │
│    .extend(withSubscribe);                                  │
│                                                             │
│  // For HSM (flattening)                                    │
│  const def = defineMachine(states, transitions, init);      │
│  const flatDef = flattenMachineDefinition(def);             │
│  const machine = createMachineFromFlat(flatDef);            │
│                                                             │
│  // For visualization                                       │
│  const manifest = getManifest(machine);                     │
│  <Visualizer manifest={manifest} state={machine.getState()} │
│              dispatch={machine.send} />                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      matchina (core)                        │
├─────────────────────────────────────────────────────────────┤
│  createMachine     - Base machine creation                  │
│  defineStates      - State factory creation                 │
│  .extend()         - Extension point                        │
│  withEventApi      - Adds event methods                     │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  matchina/hsm   │ │ matchina/inspect│ │ matchina/react  │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ flattenMachine  │ │ getManifest     │ │ useMachine      │
│ defineSubmachine│ │ getHierarchical │ │ useMachineMaybe │
│                 │ │   Manifest      │ │                 │
│ (propagate -    │ │ inspect         │ │                 │
│  experimental)  │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Migration path from `matchina()`

```typescript
// Before
import { matchina } from 'matchina';
const machine = matchina(states, transitions, 'Idle');

// After (explicit)
import { createMachine, withEventApi } from 'matchina';
const machine = createMachine(states, transitions, 'Idle')
  .extend(withEventApi);

// After (convenience, if we keep matchina as alias)
import { matchina } from 'matchina';
// Same as before, but internally uses .extend(withEventApi)
```

### Visualizer integration

```typescript
// In visualizer component
import { getManifest } from 'matchina/inspect';

function MachineVisualizer({ machine }) {
  const manifest = getManifest(machine);
  const state = machine.getState();
  
  return (
    <DiagramRenderer
      states={manifest.states}
      initial={manifest.initial}
      current={state.key}
      onTransition={(event) => machine.send(event)}
    />
  );
}
```

---

## Decision Summary

| Concern | Decision | Rationale |
|---------|----------|-----------|
| **Manifest** | Separate function in `matchina/inspect` | Tree-shakeable, explicit, keeps core lean |
| **`.extend()`** | Simple `extend<T>(fn: (m) => T): T` | Simplest possible, full TS inference |
| **HSM** | Flattening primary, propagation experimental | Simpler, more predictable, user preference |
| **Types** | Fix `any` now, TypeSlayer post-merge | Actionable vs requires tooling |

---

## Open Questions for User

1. **Manifest format**: Should we be XState-compatible or define our own? (I lean XState-compatible for tooling)

2. **`matchina()` deprecation**: Keep as convenience alias or remove entirely?

3. **Propagation fate**: Mark as `@experimental` or `@deprecated`?

4. **Extension location**: Should `withEventApi` be in core or `matchina/extras`?

---

## Next Steps

After user feedback on open questions:

1. Implement `.extend()` on FactoryMachine
2. Create `matchina/inspect` with `getManifest`
3. Reorganize HSM exports
4. Audit and fix `any` in type definitions
5. Update docs to reflect new patterns
