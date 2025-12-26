# Matchina: Hierarchical State Machine Semantics

## Overview

Matchina implements hierarchical state machines (HSMs) through **runtime event propagation** rather than compile-time flattening. The core implementation is in `src/nesting/propagateSubmachines.ts`.

---

## State Entry/Exit Rules

### Entry

1. **Parent enters first**: When transitioning to a parent state containing a child machine, the parent state is entered and its data (including `machine`) is instantiated
2. **Child machine created lazily**: The child machine is created by the state factory function when the parent state is entered
3. **No automatic child entry notification**: The child machine starts in its initial state but no explicit "entry" event is fired to the hierarchy

### Exit

1. **Final state detection**: A child state is considered "final" if:
   - `state.data.final === true` (explicit marker), OR
   - The state has no outgoing transitions (empty transitions object)

2. **`child.exit` synthesis**: When a child reaches a final state:
   - The parent receives a synthesized `child.exit` event
   - The parent can define a transition for `child.exit` to react

3. **Exit bubbling**: After any handled event, the system walks back up the machine chain checking for final states and synthesizing `child.exit` events at each level

### Code Reference (`propagateSubmachines.ts:136-142`)
```typescript
function isChildFinal(child: any, childState: any): boolean {
  if (childState?.data?.final) return true;
  const transitions = (child as any).transitions?.[childState?.key];
  return transitions && Object.keys(transitions).length === 0;
}
```

---

## Transition Resolution

### Child-First Routing

Events are routed using a **child-first** (inside-out) traversal:

1. **Descend to deepest child**: Starting from root, follow `state.data.machine` pointers to find the deepest active child
2. **Attempt handling at deepest level**: Call `child.resolveExit()` to check if child can handle the event
3. **Bubble up on failure**: If child cannot handle, try the parent, and so on up the chain
4. **First handler wins**: The first machine that can resolve the event handles it

### Code Reference (`propagateSubmachines.ts:169-232`)
```typescript
function handleAtRoot(type: string, params: any[]): any {
  function descend(m: AnyMachine): { handled: boolean; event?: any; handledBy?: AnyMachine } {
    machinesChain.push(m);
    const state = m.getState();
    const child = getChildFromParentState(state);
    
    // Try deepest first
    if (child && isFactoryMachine(child)) {
      const deep = descend(child);
      if (deep.handled) return deep;
      
      // Try child itself
      const childEv = child.resolveExit?.({ type, params, from: child.getState() });
      if (childEv) {
        child.transition?.(childEv);
        // Check for final state and synthesize child.exit
        // ...
      }
    }
    
    // Try current machine
    const ev = m.resolveExit?.({ type, params, from: state });
    if (ev) {
      m.transition?.(ev);
      return { handled: true, event: ev, handledBy: m };
    }
    
    return { handled: false };
  }
}
```

### Reserved `child.*` Events

Events starting with `child.` are handled specially:

| Event | Behavior |
|-------|----------|
| `child.exit` | Handled at immediate parent level, no descent |
| `child.change` | Internal notification mechanism for subscriber updates |

---

## Event Handling Involving Hierarchy

### Event Flow

```
root.send("event")
  │
  ├─► handleAtRoot("event", params)
  │     │
  │     ├─► descend(root) → descend(child) → descend(grandchild)
  │     │
  │     ├─► Try handling at grandchild
  │     │     └─► If handled: transition, check final, maybe child.exit
  │     │
  │     ├─► If not handled: try child
  │     │     └─► If handled: transition, check final, maybe child.exit
  │     │
  │     └─► If not handled: try root
  │           └─► If handled: transition
  │
  ├─► hookCurrentChain() - hook any new machines discovered
  │
  └─► root.send("child.change", { _internal: true }) - notify subscribers
```

### Direct Child Sends

When events are sent directly to a child machine (not through root):

1. **Send hook intercepts**: Each hooked machine has a send interceptor
2. **Event handled locally**: The child processes the event
3. **Final state check**: If child reaches final state, find parent and send `child.exit`
4. **Notification propagation**: Send `child.change` to root with `_internal: true` flag

### Code Reference (`propagateSubmachines.ts:78-125`)
```typescript
function hookMachine(m: AnyMachine) {
  const unhook = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
    const result = innerSend(type, ...params);
    
    const state = m.getState?.();
    if (state && isChildFinal(m, state)) {
      // Find parent and send child.exit
      // ...
    }
    
    // Notify root of child change
    if (result) {
      root.send('child.change', { target: m, type, params, _internal: true });
    }
    
    return result;
  })(m);
}
```

---

## Edge Cases

### 1. Event Collision

**Behavior**: First-seen wins (child takes precedence over parent)

**Example**: If both child and parent define a transition for `"submit"`, the child handles it.

### 2. Duck-Typed Children

**Behavior**: Non-branded machines are supported via duck typing

```typescript
const child = state?.data?.machine;
if (isFactoryMachine(child)) return child;
const isValid = typeof child?.getState === "function" && typeof child?.send === "function";
return isValid ? child : undefined;
```

**Edge case**: Duck-typed children that don't change state on send are considered "not handled", allowing bubbling.

### 3. Deep Nesting

**Behavior**: Supported with MAX_DEPTH guard (100 levels in inspect.ts)

**Concern**: No explicit depth limit in propagateSubmachines; relies on natural termination.

### 4. Multiple Children

**Behavior**: NOT SUPPORTED - Only single child per state via `data.machine` convention

### 5. Parallel Regions

**Behavior**: NOT SUPPORTED - No orthogonal/parallel state support

### 6. Re-entry to Same State

**Behavior**: If parent transitions to same state key, child machine is recreated (new instance from factory)

### 7. Missing Child Machine

**Behavior**: If `state.data.machine` is undefined or invalid, treated as leaf state (no descent)

---

## Ambiguities / Undocumented Behavior

### 1. Child Notification Timing

**Ambiguity**: When a child changes state, when exactly do parent subscribers get notified?

**Actual behavior**: 
- Internal `child.change` creates a self-transition event on root
- This triggers `root.transition()` which calls `notify()`
- Subscribers see a `child.change` event type, not the original event

### 2. State Identity After Child Change

**Ambiguity**: Does parent state identity change when only child changes?

**Actual behavior**: Parent state object remains the same; only child's internal state changes. This can confuse React's change detection.

**Workaround**: `child.change` triggers a self-transition to update `lastChange` reference.

### 3. `child.exit` Data Access

**Ambiguity**: What data is available in `child.exit` transition handler?

**Actual behavior**: 
```typescript
params: [{ id: state?.data?.id ?? state?.id, state: childState?.key, data: childState?.data }]
```

### 4. Hooking Timing

**Ambiguity**: When are child machines hooked for propagation?

**Actual behavior**: 
- Initial hook on `propagateSubmachines()` call
- Re-hook after every event via `hookCurrentChain()`
- Machines are hooked when discovered in active chain

### 5. Cleanup on Parent Exit

**Ambiguity**: What happens to child machine hooks when parent exits?

**Actual behavior**: Hooks remain attached but become orphaned. The disposer returned by `propagateSubmachines()` cleans up all hooked machines.

### 6. Guard Interaction with Hierarchy

**Ambiguity**: If a parent guard blocks a transition, does the child still see the event?

**Actual behavior**: No - guards are checked during `transition()`, which happens after `resolveExit()`. If child handles and transitions, parent guard doesn't apply to child's transition.

---

## Summary of Behavioral Rules

1. **Child-first event routing**: Events descend to deepest child before bubbling up
2. **First handler wins**: No event is handled by multiple machines
3. **`child.exit` on final**: Parent receives `child.exit` when child reaches final state
4. **Final = explicit or empty**: `data.final === true` OR no outgoing transitions
5. **Single child per state**: Only `data.machine` is checked; no parallel regions
6. **Hooks propagate notifications**: Direct child sends still notify root subscribers
7. **Reserved `child.*` namespace**: These events skip descent and are handled at parent level
