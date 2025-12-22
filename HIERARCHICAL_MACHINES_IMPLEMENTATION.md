# Hierarchical State Machines - Implementation Guide

This document explains how hierarchical state machines are implemented in Matchina, focusing on `propagateSubmachines` and the event routing system.

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Entry Points](#entry-points)
- [Core Architecture](#core-architecture)
- [Event Flow](#event-flow)
- [React Integration](#react-integration)
- [Critical Implementation Details](#critical-implementation-details)

## Overview

Hierarchical state machines allow nesting child machines within parent state's data. The implementation enables:

1. **Child-first event routing** - Events try the deepest child first, then bubble up
2. **Automatic child lifecycle** - Parent transitions destroy children
3. **Unified change notifications** - React/subscribers see all changes as one stream
4. **State introspection** - `nested.fullKey`, `depth`, `stack` for debugging

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Root Machine (Working)                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Child Machine (Red/Green/Yellow)                  │  │
│  │   - Hooked to route events through root           │  │
│  │   - State stamped with depth, fullKey             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Event Flow:                                            │
│  1. root.send("tick")                                   │
│  2. handleAtRoot descends to child                      │
│  3. child handles "tick" (Red → Green)                  │
│  4. child.send hook sends child.change to root          │
│  5. root creates self-transition event                  │
│  6. root.transition updates lastChange                  │
│  7. React detects change via getChange()                │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Child-First Traversal

Events descend to the deepest active child before trying parents:

```typescript
// Send "tick" to a hierarchy: Root -> Child -> GrandChild
root.send("tick")

// Flow:
// 1. Try GrandChild.resolveExit({ type: "tick" }) 
// 2. If not handled, try Child.resolveExit({ type: "tick" })
// 3. If not handled, try Root.resolveExit({ type: "tick" })
```

### 2. State Data Convention

Child machines live in parent state's `data.machine`:

```typescript
const states = defineStates({
  Working: submachine(() => createMachine(...))
  // Expands to:
  // Working: () => ({ machine: createMachine(...) })
})
```

### 3. Reserved `child.*` Events

- `child.change` - Internal notification when child state changes
- `child.exit` - Child reached final state, parent should transition

### 4. Stamping

After event handling, states get metadata:

```typescript
state.depth = 0           // How deep in hierarchy (0 = root)
state.nested.fullKey = "Working.Red"  // Dot-notation path
state.nested.stack = [workingState, redState]  // All ancestors
state.stack = [workingState]  // States up to this level
```

## Entry Points

### Public API

```typescript
// Main entry point - wraps machine with hierarchical behavior
function createHierarchicalMachine<M>(machine: M): HierarchicalMachine<M>

// Low-level - installs hooks but doesn't change type
function propagateSubmachines<M>(root: M): () => void
```

### Usage

```typescript
const parent = createMachine(/* ... */);
const hierarchical = createHierarchicalMachine(parent);

// Now events route through children:
hierarchical.send("tick"); // Tries child first, then parent
```

## Core Architecture

### Function Hierarchy

```
createHierarchicalMachine(machine)
  └─> propagateSubmachines(machine)
       ├─> hookMachine(child)              [Hook child sends]
       ├─> handleAtRoot(type, params)      [Route event down then up]
       │    └─> descend(machine)            [Recursive descent]
       ├─> stamp(statesChain)               [Add metadata to states]
       ├─> stampUsingCurrentChain()         [Discover & stamp current path]
       └─> unhookRoot via sendHook()        [Intercept root sends]
```

### Core Functions

#### 1. `propagateSubmachines(root)`

**Purpose**: Install hierarchical behavior on a root machine

**What it does**:
1. Creates a `hookedMachines` set to track all discovered children
2. Defines helper functions (hookMachine, handleAtRoot, stamp, etc.)
3. Installs a send hook on root to intercept events
4. Performs initial stamping of the current active chain
5. Returns a disposer to unhook everything

**Key variables**:
- `hookedMachines: Set<AnyMachine>` - All child machines we've hooked
- `root` - The parent machine being wrapped

#### 2. `hookMachine(m)`

**Purpose**: Intercept a child machine's sends and route them through root

**What it does**:
```typescript
function hookMachine(m: AnyMachine) {
  if (m.__propagateUnhook) return; // Already hooked
  
  const unhook = sendHook((innerSend) => (type, ...params) => {
    // 1. Let child handle its own event first
    const result = innerSend(type, ...params);
    
    // 2. Check if child reached final state
    if (isChildFinal(m, state)) {
      // Find parent and send child.exit
      parent.send('child.exit');
    }
    
    // 3. Send child.change to root for notification
    if (result && !type.startsWith('child.')) {
      root.send('child.change', { 
        target: m, 
        type, 
        params, 
        _internal: true 
      });
    }
    
    return result;
  })(m);
  
  m.__propagateUnhook = unhook;
}
```

**Key insight**: Every child's `send` becomes a two-step process:
1. Handle locally
2. Notify root (which triggers React updates)

#### 3. `handleAtRoot(type, params)`

**Purpose**: Core event routing logic - descend to deepest child, try handling, bubble up

**Flow**:

```typescript
function handleAtRoot(type: string, params: any[]): any {
  const machinesChain: AnyMachine[] = [];
  const statesChain: any[] = [];

  // Recursive descent to deepest child
  function descend(m: AnyMachine) {
    machinesChain.push(m);
    statesChain.push(m.getState());
    
    const child = getChildFromParentState(m.getState());
    
    // 1. Try deepest child first (recursive)
    if (child && isFactoryMachine(child)) {
      const deep = descend(child);
      if (deep.handled) return deep;
      
      // 2. Try this child level
      const childEv = child.resolveExit({ type, params, from: child.getState() });
      if (childEv) {
        child.transition(childEv);
        // Check if child became final -> send child.exit to parent
        if (isChildFinal(child, child.getState())) {
          const parentEv = m.resolveExit({ 
            type: 'child.exit', 
            params: [{ state: child.getState().key }] 
          });
          if (parentEv) m.transition(parentEv);
        }
        return { handled: true, handledBy: child };
      }
    }
    
    // 3. Try current machine level
    const ev = m.resolveExit({ type, params, from: m.getState() });
    if (ev) {
      m.transition(ev);
      return { handled: true, handledBy: m };
    }
    
    return { handled: false };
  }

  // Reserved child.* events skip descent
  if (type.startsWith('child.')) {
    // Handle at root level only
  }
  
  const result = descend(root);
  
  // After handling, bubble child.exit events up the chain
  if (result.handled) {
    for (let i = machinesChain.length - 2; i >= 0; i--) {
      const parent = machinesChain[i];
      const child = getChildFromParentState(parent.getState());
      if (child && isChildFinal(child, child.getState())) {
        // Bubble child.exit to parent
      }
    }
  }
  
  // Stamp hierarchy with metadata
  stampUsingCurrentChain();
  
  return result.event;
}
```

**Key insight**: This is a single monolithic function because it needs to maintain the `machinesChain` context to correctly bubble `child.exit` events after transitions deep in the hierarchy.

#### 4. `stamp(statesChain)` & `stampUsingCurrentChain()`

**Purpose**: Add metadata to states for debugging and visualization

**stamp(statesChain)**:
```typescript
function stamp(statesChain: any[]) {
  const keys = statesChain.map(s => s.key);
  const fullKey = keys.join('.');  // "Working.Red"
  
  const nested = Object.freeze({ 
    fullKey, 
    stack: statesChain.slice(), 
    machine: root 
  });
  
  for (let i = 0; i < statesChain.length; i++) {
    statesChain[i].depth = i;
    statesChain[i].nested = nested;
    statesChain[i].stack = statesChain.slice(0, i + 1);
  }
}
```

**stampUsingCurrentChain()**:
```typescript
function stampUsingCurrentChain(notify = false) {
  const states: any[] = [];
  let current: AnyMachine = root;
  
  // Follow active child pointers to build chain
  while (current) {
    const s = current.getState();
    states.push(s);
    
    const child = getChildFromParentState(s);
    if (!child) break;
    
    // Hook discovered children
    hookMachine(child);
    
    current = child;
  }
  
  stamp(states);
  
  if (notify) {
    root.notify({ type: 'child.change', params: [{ _internal: true }] });
  }
}
```

**Key insight**: Stamping happens AFTER every event to ensure states always have current metadata.

#### 5. Root Send Hook (React Integration)

**Purpose**: Intercept root's send to handle `child.change` events specially

```typescript
const unhookRoot = sendHook((innerSend) => (type, ...params) => {
  if (type === 'child.change') {
    const payload = params[0] || {};
    
    // Internal child.change - React integration fix
    if (payload._internal) {
      const currentState = root.getState();
      
      // Create a new change event for React
      const newChangeEvent = new FactoryMachineEventImpl(
        'child.change',
        currentState,  // from
        currentState,  // to (self-transition)
        [payload],
        root
      );
      
      // Update root's lastChange so getChange() returns new object
      root.transition(newChangeEvent);
      
      return;
    }
    
    // External child.change - route through handleAtRoot
    const { type: childType, params: childParams } = payload;
    return handleAtRoot(childType, childParams);
  }
  
  // All other events go through handleAtRoot
  if (type.startsWith('child.')) {
    return handleAtRoot(type, params);
  }
  return handleAtRoot(type, params);
})(root);
```

**Key insight**: This is where the React fix lives. When a child transitions, it sends `child.change` with `_internal: true`, and we create a self-transition event to update the parent's `lastChange`.

## Event Flow

### Example: Traffic Light with Nested Tick

```typescript
// Setup
const hierarchical = createHierarchicalMachine(
  createMachine(
    { Working: submachine(() => createMachine({ Red, Green, Yellow }, ...)) },
    { Working: { break: "Broken" } },
    "Working"
  )
);

// Initial state: Working.Red
```

#### Flow when `hierarchical.send("tick")` is called:

```
1. Root's send hook intercepts
   └─> type="tick" → not child.* → call handleAtRoot("tick", [])

2. handleAtRoot starts descent
   ├─> descend(root)
   │   ├─> machinesChain = [root]
   │   ├─> statesChain = [Working state]
   │   ├─> child = Working.data.machine (the light machine)
   │   └─> descend(child)
   │       ├─> machinesChain = [root, child]
   │       ├─> statesChain = [Working state, Red state]
   │       ├─> no grandchild
   │       ├─> child.resolveExit({ type: "tick", from: Red })
   │       │   └─> returns event: tick(Red → Green)
   │       ├─> child.transition(event)
   │       │   └─> child now in Green state
   │       └─> return { handled: true, handledBy: child }
   └─> result.handled = true

3. stampUsingCurrentChain()
   └─> Stamps: Working.Green with depth, fullKey, etc.

4. Send child.change notification
   └─> root.send('child.change', { target: child, type: "tick", _internal: true })

5. Root send hook intercepts child.change
   ├─> payload._internal = true
   ├─> currentState = Working
   ├─> Create new event: child.change(Working → Working)
   ├─> root.transition(newChangeEvent)
   │   └─> Updates root's lastChange
   └─> Now root.getChange() returns NEW object
       └─> React detects change and re-renders!
```

### Critical Path: Child Send Hook

When a child machine sends an event directly (not through root):

```
1. Child's hooked send intercepts
   └─> hookMachine's send wrapper activates

2. innerSend(type, ...params)
   └─> Child handles event locally

3. Check if child reached final state
   ├─> If yes: find parent, send child.exit
   └─> If no: continue

4. Send child.change to root
   └─> root.send('child.change', { 
         target: child, 
         type, 
         params, 
         _internal: true 
       })

5. Root's send hook creates self-transition
   └─> Updates lastChange for React
```

## React Integration

### The Problem

React's `useSyncExternalStore` uses `Object.is()` equality:

```typescript
function useMachine(machine) {
  const getSnapshot = () => machine.getChange();
  
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );
}

// React calls getSnapshot and compares:
const prev = getSnapshot();  // Returns machine.lastChange
// ... child transitions ...
const next = getSnapshot();  // Returns same machine.lastChange!
// prev === next → no re-render 😢
```

### The Solution

When a child transitions, create a new change event for the parent:

```typescript
// Before fix:
child transitions Red → Green
parent.lastChange still points to old event (Working initial)
getChange() returns same object
React doesn't re-render

// After fix:
child transitions Red → Green
child sends child.change with _internal: true
root.transition(new FactoryMachineEventImpl('child.change', Working, Working))
parent.lastChange now points to NEW event
getChange() returns different object
React re-renders! ✅
```

### Self-Transition Pattern

```typescript
const currentState = root.getState();  // Working

// Create event where from === to (self-transition)
const event = new FactoryMachineEventImpl(
  'child.change',
  currentState,  // from: Working
  currentState,  // to: Working (same state)
  [payload],
  root
);

// This updates lastChange without changing state
root.transition(event);
```

**Key insight**: A transition doesn't have to change states. By creating a transition event where `from === to`, we update `lastChange` (making React happy) without changing the parent's actual state.

## Critical Implementation Details

### 1. Why handleAtRoot is Monolithic

`handleAtRoot` is one large function because it needs to maintain `machinesChain` and `statesChain` across the entire descent and bubble-up process. Splitting it would require passing this context through multiple function calls, making it harder to maintain.

### 2. Hook Installation Timing

Child machines are hooked lazily as they're discovered:

```typescript
// In stampUsingCurrentChain:
while (current) {
  const child = getChildFromParentState(current.getState());
  if (child) {
    hookMachine(child);  // Hook on discovery
    current = child;
  }
}
```

This means:
- Children created during initial setup are hooked immediately
- Children created later (e.g., state factories) are hooked when first encountered

### 3. The `_internal` Flag

Used to distinguish:
- Internal notifications (child → root after transition) → update lastChange
- External routing (user calls `send('child.change', ...)`) → route through handleAtRoot

### 4. Double Notification Prevention

Original bug: calling both `transition()` and `notify()`:

```typescript
// ❌ Wrong - double notification
root.transition(newEvent);  // Triggers notify through lifecycle
root.notify(...);           // Triggers notify again

// ✅ Correct - transition calls notify
root.transition(newEvent);  // Triggers notify once
```

### 5. Try/Catch in Stamping

States might be frozen, so stamping uses try/catch:

```typescript
try {
  state.depth = i;
  state.nested = nested;
  state.stack = statesChain.slice(0, i + 1);
} catch {
  // Ignore frozen objects
}
```

## Common Patterns

### Creating a Hierarchical Machine

```typescript
// 1. Define child machine
const childStates = defineStates({ A, B, C });
const childMachine = () => createMachine(childStates, ...);

// 2. Use submachine helper
const parentStates = defineStates({
  Working: submachine(childMachine),
  Broken: undefined
});

// 3. Create parent machine
const parent = createMachine(parentStates, ...);

// 4. Wrap with hierarchical behavior
const hierarchical = createHierarchicalMachine(parent);

// 5. Events now route through children
hierarchical.send("tick");  // Tries child first
```

### Accessing Child State

```typescript
const state = hierarchical.getState();

if (state.is("Working")) {
  const child = state.data.machine;
  const childState = child.getState();
  console.log(`Parent: ${state.key}, Child: ${childState.key}`);
  console.log(`Full path: ${state.nested.fullKey}`);
}
```

### Using with React

```typescript
function TrafficLight() {
  const machine = useMemo(() => createNestedController(), []);
  const change = useMachine(machine);  // Subscribes to changes
  
  const state = machine.getState();
  const child = state.is("Working") ? state.data.machine : null;
  const lightColor = child?.getState().key;
  
  return (
    <div>
      <div>Controller: {state.key}</div>
      <div>Light: {lightColor}</div>
      <button onClick={() => machine.send("tick")}>Tick</button>
    </div>
  );
}
```

## Debugging Tips

### Inspecting the Hierarchy

```typescript
const state = machine.getState();

// Check depth
console.log(state.depth);  // 0 for root, 1 for first child, etc.

// Check full path
console.log(state.nested.fullKey);  // "Working.Red"

// Check stack (all ancestors)
console.log(state.stack.map(s => s.key));  // ["Working", "Red"]
```

### Tracing Event Flow

Add logging to hooks:

```typescript
const unhook = sendHook((innerSend) => (type, ...params) => {
  console.log(`[SEND] ${type}`, params);
  const result = innerSend(type, ...params);
  console.log(`[RESULT]`, result);
  return result;
});
```

### Checking Hook Status

```typescript
if ((machine as any).__propagateUnhook) {
  console.log("Machine is hooked");
}

if ((machine as any).hierarchical) {
  console.log("Machine has hierarchical behavior");
}
```

## Testing Hierarchical Machines

### Test Child-First Routing

```typescript
it("routes to child first, bubbles to parent", () => {
  const parent = createHierarchicalMachine(/* ... */);
  
  parent.send("tick");
  
  // Check child handled it
  const child = parent.getState().data.machine;
  expect(child.getState().key).toBe("Green");
  
  // Parent didn't transition
  expect(parent.getState().key).toBe("Working");
});
```

### Test React Integration

```typescript
it("getChange returns different objects when child changes", () => {
  const machine = createHierarchicalMachine(/* ... */);
  
  const before = machine.getChange();
  machine.send("tick");  // Child transitions
  const after = machine.getChange();
  
  expect(after).not.toBe(before);  // Critical for React
});
```

### Test child.exit Bubbling

```typescript
it("sends child.exit when child reaches final state", () => {
  const parent = createHierarchicalMachine(/* ... */);
  
  parent.send("complete");  // Makes child final
  
  // Parent should have transitioned due to child.exit
  expect(parent.getState().key).toBe("Done");
});
```

## Performance Considerations

### Stamping Overhead

Stamping happens after every event. For deep hierarchies, this could be expensive:

```typescript
// For depth N hierarchy:
// - O(N) to traverse and collect states
// - O(N) to stamp each state
// Total: O(N) per event
```

Optimization: States are stamped in-place with try/catch for frozen objects.

### Hook Overhead

Each hooked machine adds an extra function call per send:

```typescript
// Without hooks: machine.send("tick")
// With hooks: hook wrapper → innerSend → actual send
```

Optimization: Hooks are added only once per machine (checked via `__propagateUnhook`).

## Future Improvements

### Possible Optimizations

1. **Lazy Stamping**: Only stamp when `nested` or `depth` is accessed
2. **Cached Chains**: Cache the active chain between events
3. **Selective Hooking**: Only hook children that need notification

### Known Limitations

1. **No Parallel Regions**: Only one active child per state
2. **No History States**: Children start fresh on re-entry
3. **Duck Typing**: Non-FactoryMachines need `getState` and `send`

## Summary

The hierarchical machine implementation provides:

✅ **Child-first event routing** via recursive `handleAtRoot`  
✅ **Automatic change propagation** via `hookMachine` send wrappers  
✅ **React integration** via self-transition on child changes  
✅ **State introspection** via stamping with `depth`, `fullKey`, `stack`  
✅ **Lifecycle management** via `child.exit` bubbling  

The core insight is treating child transitions as parent state changes (from React's perspective) by creating self-transition events that update `lastChange` without changing the parent's actual state.
