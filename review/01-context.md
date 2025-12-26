# Matchina: Conceptual Model

## What This Library Is

Matchina is a TypeScript-first toolkit for building **type-safe state machines** with powerful pattern matching. It is:

- **Lightweight**: ~3.4 kB full library gzipped, individual primitives 300-600 bytes
- **Modular**: Use only what you need—matchbox alone, machines alone, or composed
- **Zero dependencies**: No runtime dependencies
- **Framework agnostic**: Works with any UI library (React integration optional)

## Problems It Solves

1. **Type-safe discriminated unions**: Create tagged unions with `.match()`, `.is()`, `.as()` methods that TypeScript understands
2. **Type-safe state transitions**: Transition parameter types are inferred from destination state constructors
3. **Async state management**: `createPromiseMachine` wraps promises in Idle/Pending/Resolved/Rejected states
4. **Lifecycle interception**: Guards, enter/leave hooks, and effects for reacting to state changes
5. **Hierarchical composition**: Nest child machines within parent states (experimental)

## Intended Mental Model

### Layer 1: Matchbox (Foundation)

The `matchbox` pattern creates **type-safe tagged unions** (discriminated unions):

```ts
const State = matchbox({
  Idle: () => ({}),
  Loading: (id: string) => ({ id }),
  Done: (result: Data) => ({ result }),
});

const state = State.Loading("123");
state.is("Loading");  // type guard → true
state.match({ ... }); // exhaustive pattern matching
```

**Mental model**: A matchbox is a factory that produces branded objects with a `key` discriminator and typed `data`. Every state value knows its own type and can be pattern-matched.

### Layer 2: State Machines

Three machine flavors built on matchbox:

| Machine | Purpose | Entry Point |
|---------|---------|-------------|
| **Factory Machine** | Full-featured FSM with typed transitions | `createMachine()` |
| **Store Machine** | Simple state container with transitions | `createStoreMachine()` |
| **Promise Machine** | Async operation state (Idle→Pending→Resolved/Rejected) | `createPromiseMachine()` |

**Mental model**: A machine wraps a matchbox with transition logic. Transitions are functions or string shortcuts that produce the next state. The machine tracks current state and exposes typed methods for each transition.

### Layer 3: Lifecycle Hooks

Hook into state transitions via `setup()`:

```ts
setup(machine)(
  guard((ev) => /* prevent transition */),
  enter((ev) => /* react to entering state */),
  leave((ev) => /* react to leaving state */),
  effect((ev) => /* handle side effects */)
);
```

**Mental model**: Hooks are middleware that intercept the transition pipeline. Guards can abort; enter/leave/effect observe and react.

### Layer 4: Hierarchical Machines (Experimental)

Nest child machines within parent states:

```ts
const parentStates = defineStates({
  Idle: undefined,
  Active: (child: ChildMachine) => ({ machine: child }),
});
```

**Mental model**: Hierarchy is about **control ownership**, not categorization. A parent state temporarily delegates control to a child. When the child reaches a final state, `child.exit` bubbles up. Events route child-first.

## How Hierarchical State Machines Are Expressed

### Conceptual Structure

1. **States can contain machines**: A state's data can include a `machine` property holding a child machine
2. **Final states signal completion**: Child states with `{ final: true }` trigger `child.exit` in parent
3. **Two routing patterns**:
   - **Direct access**: Parent exposes child via `Object.assign(parent, { child })`, caller invokes child directly
   - **Event propagation**: `propagateSubmachines()` routes events child-first automatically

### Key Invariants

- **Control ownership**: Parent owns child lifecycle; exiting parent destroys child context
- **Child-first routing**: Events attempt child handling before parent
- **Exit bubbling**: Child completion (`final: true`) triggers parent's `child.exit` transition
- **No parallel regions**: Single active child per state (unlike UML statecharts)

### Limitations (Documented)

- Complex nested types may require explicit annotations
- No parallel/orthogonal regions
- Limited visualization tooling
- Event collision is first-seen wins

## Design Philosophy

From README and CLAUDE.md:

- **TypeScript-first**: Type inference over explicit types; exhaustive matching enforced
- **Nano-sized primitives**: Each feature standalone or composable
- **Immutability**: All transitions create new state objects
- **Composable hooks**: Multiple hooks via `setup(machine)(...)` 
- **Inspired by**: XState (concepts), Timsy (simplicity), safety-match (pattern matching), unionize (tagged unions)
