# Matchina: API Brainstorm

This document explores API design from first principles to inform Decision 2.

---

## Current State

### Machine Creation APIs

| API | Purpose | Returns |
|-----|---------|---------|
| `createMachine(states, transitions, initial)` | Core machine creation | FactoryMachine |
| `matchina(states, transitions, initial)` | Wrapper with event methods | FactoryMachine + event API |
| `createMachineFrom(definition)` | From definition object | FactoryMachine |
| `createMachineFromFlat(flatDef)` | From flattened definition | FactoryMachine |
| `defineMachine(states, transitions, initial)` | Create definition + factory | { def, factory } |

### The Confusion

`matchina()` vs `createMachine()` exists because:
- `createMachine()` returns bare machine with `.send(type, ...params)`
- `matchina()` adds event methods: `.next()`, `.submit()`, etc.
- User didn't want to force devs to build API layer

But this creates confusion: which should I use?

---

## Design Principles (From User Feedback)

1. **À la carte**: Minimal footprint based on what's used
2. **Layered**: Small core(s) with composable layers
3. **Not "one way"**: Provide common way(s), not the only way
4. **Definitions matter**: Need runtime inspection for visualizers
5. **Flexibility in hooks**: Different devs prefer different patterns

---

## Research: How Other Libs Do It

### XState

```typescript
// Definition
const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { on: { TOGGLE: 'inactive' } }
  }
});

// Instance (interpreter)
const toggleService = interpret(toggleMachine).start();
toggleService.send('TOGGLE');

// Access definition
toggleMachine.config  // Original config
toggleMachine.states  // State nodes
```

**Pattern**: Definition is the machine. Interpreter is the instance.

### Zustand

```typescript
// Definition + Instance combined
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Usage
const count = useStore((state) => state.count);
useStore.getState().increment();
```

**Pattern**: Factory returns both store and hook. No separate definition.

### Redux Toolkit

```typescript
// Slice definition
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },
  },
});

// Extract parts
const { actions, reducer } = counterSlice;
actions.increment()  // Action creator
```

**Pattern**: Slice contains definition. Actions extracted for use.

### Robot (Simple FSM)

```typescript
// Definition + Instance
const machine = createMachine({
  idle: state(transition('fetch', 'loading')),
  loading: state(transition('done', 'idle')),
});

// Usage
const service = interpret(machine, () => {});
service.send('fetch');
```

**Pattern**: Similar to XState. Definition separate from interpreter.

---

## Key Insight: Definition vs Instance

Most libs separate:
- **Definition**: The structure (states, transitions, config)
- **Instance**: The runtime (current state, send events)

Matchina currently blurs this:
- `createMachine()` returns an instance directly
- `defineMachine()` returns both definition and factory
- No clear "this is the definition, this is the instance" separation

---

## Brainstorm: Fresh API Design

### Option A: XState-like Separation

```typescript
// Definition (static, inspectable)
const toggleDef = defineStates({
  On: () => ({ label: "On" }),
  Off: () => ({ label: "Off" }),
}).withTransitions({
  On: { toggle: "Off" },
  Off: { toggle: "On" },
});

// Instance (runtime)
const toggle = createMachine(toggleDef, "Off");
toggle.send("toggle");

// Access definition for viz
toggleDef.states   // State definitions
toggleDef.transitions  // Transition map
```

**Pros**: Clear separation, good for viz
**Cons**: More verbose, two concepts to learn

### Option B: Factory Pattern (Current, Refined)

```typescript
// Factory creates instances
const createToggle = defineFactory({
  states: {
    On: () => ({ label: "On" }),
    Off: () => ({ label: "Off" }),
  },
  transitions: {
    On: { toggle: "Off" },
    Off: { toggle: "On" },
  },
  initial: "Off",
});

// Create instance
const toggle = createToggle();
toggle.send("toggle");

// Access definition
createToggle.definition  // For viz
```

**Pros**: Single function, definition attached
**Cons**: Definition access is secondary

### Option C: Builder Pattern

```typescript
// Build up definition
const toggle = machine()
  .state("On", () => ({ label: "On" }))
  .state("Off", () => ({ label: "Off" }))
  .transition("On", "toggle", "Off")
  .transition("Off", "toggle", "On")
  .initial("Off")
  .create();

// Definition available
toggle.definition  // For viz
```

**Pros**: Fluent, discoverable via IDE
**Cons**: Verbose, harder to type

### Option D: Current + Clearer Naming

```typescript
// Keep current API, just rename for clarity
const toggleDef = defineStates({ ... });  // State factory (unchanged)

// Rename createMachine → machine (shorter, clearer it's an instance)
const toggle = machine(toggleDef, transitions, "Off");

// Rename matchina → machine.withApi (explicit about what it adds)
const toggle = machine.withApi(toggleDef, transitions, "Off");
toggle.toggle();  // Event method

// Definition access
toggle.definition  // Attached for viz
```

**Pros**: Minimal change, clearer naming
**Cons**: Still two ways to create

---

## Hook Registration Patterns

### Current Patterns

```typescript
// Pattern 1: setup() + functions (user's preference)
setup(machine)(
  guard((ev) => ev.type !== "forbidden"),
  enter((ev) => console.log("entered", ev.to.key)),
);

// Pattern 2: transitionHook() (declarative, new, liked)
transitionHook(machine, {
  from: "Loading",
  to: "Success",
  enter: (ev) => console.log("loaded!"),
});

// Pattern 3: onLifecycle() (state-keyed, "abomination" but XState-like)
onLifecycle(machine, {
  Loading: {
    enter: () => startLoading(),
    on: { cancel: () => abortLoading() },
  },
});
```

### Recommendation

Keep all three. They serve different mental models:
- `setup()`: Functional composition (FP-minded devs)
- `transitionHook()`: Declarative config (config-minded devs)
- `onLifecycle()`: State-centric (XState migrants)

Document which is recommended for common cases.

---

## Definitions for Visualization

### Requirements

Visualizers need:
1. List of states with metadata
2. Transition map (from → event → to)
3. Initial state
4. Hierarchy structure (if HSM)

### Current State

```typescript
// defineMachine returns
{
  def: {
    states: StateFactory,
    transitions: TransitionMap,
    initial: string,
  },
  factory: () => Machine,
}
```

This works but isn't attached to instances.

### Proposal: Attach Definition to Instance

```typescript
const machine = createMachine(states, transitions, "Off");

// Definition accessible
machine.definition = {
  states: Object.keys(states),  // ["On", "Off"]
  transitions: transitions,      // { On: { toggle: "Off" }, ... }
  initial: "Off",
};

// For HSM with flattening
machine.definition = {
  states: ["Working", "Working.Red", "Working.Green", "Broken"],
  transitions: { ... },
  initial: "Working.Red",
  hierarchy: {
    Working: ["Working.Red", "Working.Green", "Working.Yellow"],
    Broken: [],
  },
};
```

---

## Proposed API Direction

### Core Principle

**One primary way, alternatives documented.**

### Primary API

```typescript
import { defineStates, machine } from "matchina";

// 1. Define states
const states = defineStates({
  On: () => ({ label: "On" }),
  Off: () => ({ label: "Off" }),
});

// 2. Create machine (renamed from createMachine for brevity)
const toggle = machine(states, {
  On: { toggle: "Off" },
  Off: { toggle: "On" },
}, "Off");

// 3. Use
toggle.send("toggle");
const state = toggle.getState();

// 4. Access definition (for viz)
toggle.definition.states      // ["On", "Off"]
toggle.definition.transitions // { On: { toggle: "Off" }, ... }
```

### With Event API (Optional Layer)

```typescript
import { defineStates, machine, withEventApi } from "matchina";

const toggle = withEventApi(machine(states, transitions, "Off"));
toggle.toggle();  // Direct event method
```

Or as shorthand:

```typescript
import { matchina } from "matchina";  // Keep for backwards compat

const toggle = matchina(states, transitions, "Off");
toggle.toggle();
```

### Hook Registration

```typescript
import { setup, guard, enter, transitionHook } from "matchina";

// Recommended: setup() for most cases
setup(toggle)(
  guard((ev) => ev.type !== "forbidden"),
  enter((ev) => console.log("entered")),
);

// Alternative: transitionHook() for specific transitions
transitionHook(toggle, {
  from: "Loading",
  to: "Success", 
  enter: (ev) => celebrate(),
});
```

---

## Open Questions

1. **Rename `createMachine` to `machine`?** Shorter, but breaking change.

2. **Keep `matchina()` or rename to `machine.withApi()`?** 

3. **How to attach definition to instance?** Property? Method? Symbol?

4. **Should definition be frozen/immutable?**

5. **What's the minimal definition format for viz?**

---

## Next Steps

1. Decide on naming: `createMachine` vs `machine`
2. Decide on event API: `matchina()` vs `withEventApi()`
3. Design definition attachment format
4. Prototype and test with visualizer
