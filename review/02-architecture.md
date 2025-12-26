# Matchina: Architecture & Abstractions

## Core Abstractions

### 1. Matchbox (Foundation Layer)

**File**: `src/matchbox-factory.ts`

**Responsibility**: Create type-safe tagged unions with pattern matching capabilities.

**Key Components**:
- `matchboxFactory<Config>()` — Factory that produces state constructors from a config object
- `matchbox<Config, Tag>()` — Creates individual matchbox instances
- `MatchboxImpl` — Internal class providing `.is()`, `.as()`, `.match()` methods

**Design Pattern**: Each matchbox instance carries:
- A `tag` property (configurable, default "tag")
- A `data` property with the state's payload
- Methods for type guards and pattern matching

### 2. Event Lifecycle (Middleware Layer)

**File**: `src/event-lifecycle.ts`

**Responsibility**: Provide a composable pipeline for handling state transitions.

**Pipeline Stages** (in order):
1. `guard(ev)` — Can abort transition by returning false
2. `handle(ev)` — Transform event, can abort by returning undefined
3. `before(ev)` — Pre-transition hook, can abort
4. `update(ev)` — Apply state change (calls the update callback)
5. `effect(ev)` — Side effects; calls `leave()` then `enter()`
6. `notify(ev)` — Notify subscribers
7. `after(ev)` — Post-transition hook

**Key Function**: `withLifecycle(target, updateFn)` — Mixes lifecycle methods into any object.

### 3. Factory Machine (Primary State Machine)

**File**: `src/factory-machine.ts`

**Responsibility**: Full-featured state machine with typed transitions.

**Key Components**:
- `createMachine(states, transitions, init)` — Main factory function
- `resolveNextState()` — Looks up transition and resolves next state
- `resolveExitState()` — Executes transition function or string shortcut

**State Resolution**:
- String transition: `"TargetState"` → calls `states.TargetState(...params)`
- Function transition: `(params) => state` or `(params) => (ev) => state`

**Branding**: Uses `brandFactoryMachine()` for runtime type identification.

### 4. Store Machine (Simple State Container)

**File**: `src/store-machine.ts`

**Responsibility**: Event-driven store for single values (not tagged unions).

**Key Differences from Factory Machine**:
- No matchbox states—just raw values
- Transitions return values directly or via curried functions
- Uses `dispatch(type, ...params)` instead of `send()`

### 5. Promise Machine (Async Wrapper)

**File**: `src/promise-machine-impl.ts`

**Responsibility**: State machine for async operations.

**Fixed States**: `Idle`, `Pending`, `Resolved`, `Rejected`

**Key Method**: `execute(...params)` — Runs the promise and manages state transitions.

### 6. Setup & Extensions (Configuration Layer)

**File**: `src/ext/setup.ts`

**Responsibility**: Compose and apply setup functions to machines.

**Key Functions**:
- `setup(target)(...setups)` — Apply setups to a specific target
- `createSetup(...setups)` — Create reusable setup composition
- `createDisposer(fns)` — Aggregate cleanup functions

### 7. Hierarchical Machines (Experimental)

**Files**: `src/nesting/propagateSubmachines.ts`, `src/definitions.ts`

**Responsibility**: Nest child machines within parent states.

**Two Approaches**:

1. **Definition-based Flattening** (`definitions.ts`):
   - `defineMachine()`, `defineSubmachine()` — Declarative definitions
   - `flattenMachineDefinition()` — Compiles hierarchy to flat state keys
   - Produces `"Parent.Child.Leaf"` style keys

2. **Runtime Propagation** (`propagateSubmachines.ts`):
   - `propagateSubmachines(root)` — Installs event routing hooks
   - `createHierarchicalMachine(machine)` — Convenience wrapper
   - Child-first event routing with `child.exit` bubbling

---

## Responsibility Boundaries

| Layer | Knows About | Does Not Know About |
|-------|-------------|---------------------|
| **Matchbox** | Tags, data, pattern matching | Machines, transitions, lifecycle |
| **EventLifecycle** | Pipeline stages, hooks | State types, transition logic |
| **FactoryMachine** | States, transitions, events | Hierarchy, propagation |
| **StoreMachine** | Values, dispatch | Tagged unions, pattern matching |
| **PromiseMachine** | Async states, execute | Custom states |
| **Setup/Ext** | Hook composition | Machine internals |
| **Nesting** | Parent/child relationships | Flattening vs propagation choice |

---

## Where Hierarchy Is Implemented

### Approach 1: Flattening (`definitions.ts`)

**Compile-time transformation**:
```
defineMachine(
  { Working: defineSubmachine({ Red, Green }, ...) },
  transitions,
  "Working"
)
↓ flattenMachineDefinition()
↓
{ "Working.Red": ..., "Working.Green": ... }
```

**Key Functions**:
- `flattenFromRaw()` — Recursive flattening with delimiter
- `ensureFlatTransition()` — First-seen-wins collision policy
- `extractRawFromFactory()` — Probe factory to extract raw structure

### Approach 2: Propagation (`propagateSubmachines.ts`)

**Runtime event routing**:
```
root.send("event")
  → handleAtRoot() descends to deepest child
  → child.resolveExit() / child.transition()
  → if child final: parent.send("child.exit")
  → hookCurrentChain() for new machines
```

**Key Functions**:
- `handleAtRoot()` — Core descent/bubble logic (~120 lines)
- `hookMachine()` — Installs send interceptor on discovered children
- `isChildFinal()` — Checks `data.final` or empty transitions

---

## Conceptual Inconsistencies / Duplication

### 1. Two Hierarchy Approaches Without Clear Guidance

- **Flattening** (`definitions.ts`) — Compile-time, produces flat keys
- **Propagation** (`propagateSubmachines.ts`) — Runtime, preserves nested structure

Both are exported and documented, but:
- No clear guidance on when to use which
- Flattening has "EXPERIMENTAL" warnings; propagation does not
- Different mental models (flat keys vs nested machines)

### 2. Multiple Machine Creation Paths

| Function | Returns | Notes |
|----------|---------|-------|
| `createMachine()` | FactoryMachine | Core API |
| `matchina()` | FactoryMachine + event API | Wrapper with `assignEventApi()` |
| `createMachineFrom()` | FactoryMachine | From definition object |
| `createMachineFromFlat()` | FactoryMachine | From flattened definition |
| `createHierarchicalMachine()` | HierarchicalMachine | Wrapper with propagation |

### 3. State Definition Duplication

- `defineStates()` in `define-states.ts` — Shorthand for matchbox
- `matchboxFactory()` in `matchbox-factory.ts` — Full factory
- `normalizeStates()` in `definitions.ts` — Internal normalization

All produce similar output but with different ergonomics.

### 4. Hook Registration Patterns

Multiple ways to register hooks:
- `setup(machine)(guard(...), enter(...))` — Functional composition
- `transitionHook({ from, to, type, guard, enter })` — Declarative config
- `onLifecycle(machine, { State: { enter, leave } })` — State-keyed config
- Direct assignment: `machine.guard = fn`

### 5. Event API Assignment

- `assignEventApi()` in `extras/zen.ts` — Adds transition methods
- `addEventApi()` — Similar but different signature
- `matchina()` — Calls `assignEventApi()` internally

### 6. Child Detection Heuristics

In `propagateSubmachines.ts`:
```ts
function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = state?.data?.machine as any;
  if (!m) return undefined;
  if (isFactoryMachine(m)) return m;
  // Duck-typed fallback
  const isValid = typeof m?.getState === "function" && typeof m?.send === "function";
  return isValid ? m : undefined;
}
```

This relies on convention (`data.machine`) rather than explicit marking.

### 7. Final State Detection

Two different approaches:
- `data.final === true` — Explicit marker
- Empty transitions object — Implicit (no outgoing transitions)

Both are checked in `isChildFinal()`, but the implicit approach is fragile.

---

## Architectural Observations

### Strengths

1. **Clean lifecycle pipeline** — `EventLifecycle` is well-factored and composable
2. **Matchbox foundation** — Solid discriminated union implementation
3. **Branding for type guards** — `isFactoryMachine()` enables reliable runtime checks
4. **Setup composition** — `setup()` pattern is flexible and disposer-friendly

### Concerns

1. **Hierarchy complexity** — `propagateSubmachines.ts` is 375 lines with complex recursive logic
2. **Convention over configuration** — Child detection relies on `data.machine` convention
3. **Multiple entry points** — Users must choose between `createMachine`, `matchina`, `defineMachine`, etc.
4. **Experimental surface area** — Flattening and propagation both exposed but marked experimental
