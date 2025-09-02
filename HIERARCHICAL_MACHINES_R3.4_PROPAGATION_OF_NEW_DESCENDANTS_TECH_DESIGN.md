# HIERARCHICAL_MACHINES R3.4 – Propagation Of New Descendants (Tech Design)

Status: Draft → Implementable  
Owner: Winston / matchina  
Scope: FactoryMachine only (exclude StoreMachine)

## Hard constraints (MUST)
- Do NOT override getState.
- Do NOT use WeakRefs/WeakMaps/Maps for tracking.
- Do NOT add private fields on machine instances.
- Do NOT use transient flags.
- Do NOT manually call notify; use first‑class lifecycle only (resolveExit → transition).
- Child‑first handling for all events, except reserved "child.*" which are handled at the immediate parent.
- Every non‑root change causes each ancestor to pass through its full lifecycle (so the root observes a change consistently).

## UI ergonomics (MUST)
- Stamp `depth` on each active state.
- Provide a shared per‑change `nested` context on every active state so UIs never traverse at read time.
- Access: `const s = machine.getState(); s.depth; s.nested.fullKey; s.nested.stack; s.nested.machine`.
- The same `s.nested` instance is shared across all active states for a given change.

## Terminology
- **change**: one completed handling of a single event starting at the root.
- **active states (chain)**: the sequence of currently active states from root down to the lowest active descendant.

## Public surface used
- Existing extension points: `sendHook(sendware)(machine)`, `resolveExit`, `transition`.
- `submachine(fn, opts)` for declaring nested machines.
- Helper: `propagateSubmachines(root)` to enable hierarchical propagation.

## Core principle: resolveExit chain IS the propagation

The key insight: **ALL downward propagation happens in resolveExit, as a chain, traversing all the way down automatically**. When `root.resolveExit` is done, everything is fucking resolved and fucking propagated before we give it back to the consumer. No separate passes, no walking, no discovery phases.

## Design pillars

### 1) Non-root sends MUST be blocked and resent through root
- `propagateSubmachines(root)` uses `sendHook(sendware)(machine)` to intercept sends on discovered machines.
- When a non-root machine tries to send, the hook blocks it and calls `root.send(...)` instead.
- The sendware is attached when machines are discovered and detached when they leave.

### 2) resolveExit chain performs all propagation synchronously
- Root handling starts with `root.resolveExit({ type, params, from })`.
- If root doesn't resolve, it automatically descends to child via `from.data?.machine` and calls `child.resolveExit(...)`.
- This continues down the chain until someone resolves or chain ends.
- **Stamping happens DURING this chain, not after.**
- When the chain returns, everything is resolved and stamped.

### 3) child.change event contract
When a non-root machine tries to send `someEvent`, the send hook transforms it:
- Blocked: `child.send('someEvent', ...params)`
- Becomes: `root.send('child.change', { target: child, type: 'someEvent', params })`
- Root's resolveExit sees `child.change` and can either handle it at root level or delegate back down.
- When delegating down, root calls `target.send('someEvent', ...params)` - this time the hook allows it because it came from root.

### 4) Reserved child.* events handled at immediate parent
- `child.exit` is synthesized when a child reaches final or loses its submachine.
- These bubble up one parent at a time until handled.

## Algorithm

### A) propagateSubmachines(root)
```typescript
// Attach send hook to root that handles child.* events at parent level
const unhookRoot = sendHook((innerSend) => (type, ...params) => {
  if (type.startsWith('child.')) {
    // Handle at this level via resolveExit → transition
    const ev = root.resolveExit({ type, params, from: root.getState() });
    if (ev) root.transition(ev);
    return;
  }
  // Normal event - proceed to root resolveExit chain
  return handleAtRoot(type, params);
})(root);

// Hook any currently active descendants
hookActiveDescendants(root);
```

### B) Root resolveExit chain (child-first, with stamping)
```typescript
function handleAtRoot(type, params) {
  const chain = []; // Will be built during resolution
  const result = resolveWithChain(root, { type, params }, chain);
  
  // Stamp depth and nested on all states in the chain
  const nested = Object.freeze({
    fullKey: chain.map(s => s.key).join('.'),
    stack: chain.slice(),
    machine: root
  });
  
  chain.forEach((state, i) => {
    state.depth = i;
    state.nested = nested;
  });
  
  // Hook any newly discovered machines
  hookNewlyDiscovered(chain);
  
  return result;
}

function resolveWithChain(machine, event, chain) {
  const state = machine.getState();
  chain.push(state);
  
  // Try to resolve at this level
  const ev = machine.resolveExit(event);
  if (ev) {
    machine.transition(ev);
    
    // Check for child exit after transition
    const newState = machine.getState();
    if (childWentFinal(state, newState)) {
      // Synthesize child.exit and handle at parent
      synthesizeChildExit(machine, newState);
    }
    
    return ev;
  }
  
  // If unresolved and has child, descend
  const child = state.data?.machine;
  if (child && isFactoryMachine(child)) {
    return resolveWithChain(child, event, chain);
  }
  
  // Unresolved
  return null;
}
```

### C) Send hook mechanics
```typescript
function hookActiveDescendants(root) {
  // Walk current active chain and hook each machine
  let current = root;
  while (true) {
    const state = current.getState();
    const child = state.data?.machine;
    if (!child || !isFactoryMachine(child)) break;
    
    hookMachine(child, root);
    current = child;
  }
}

function hookMachine(machine, root) {
  if (machine.__propagateUnhook) return; // Already hooked
  
  machine.__propagateUnhook = sendHook((innerSend) => (type, ...params) => {
    if (type.startsWith('child.')) {
      // Handle at this machine's level
      const ev = machine.resolveExit({ type, params, from: machine.getState() });
      if (ev) machine.transition(ev);
      return;
    }
    
    // Non-root send - block and redirect to root
    return root.send('child.change', { target: machine, type, params });
  })(machine);
}

function unhookMachine(machine) {
  if (machine.__propagateUnhook) {
    machine.__propagateUnhook();
    delete machine.__propagateUnhook;
  }
}
```

## Event contracts

### child.change
- **Purpose**: Represents a non-root machine attempting to send an event.
- **Shape**: `{ target: FactoryMachine, type: string, params: any[] }`
- **Handling**: Root can either handle at root level or delegate back to target via `target.send(type, ...params)`.

### child.exit  
- **Purpose**: Synthesized when a child reaches final or loses its submachine.
- **Shape**: `{ id: string, state: string, data: any }`
- **Handling**: Handled at the immediate parent level via resolveExit → transition.

## Properties guaranteed

1. **Non-root sends are intercepted**: Any `child.send(...)` becomes `root.send('child.change', ...)`.
2. **Ancestors pass through lifecycle**: Every non-root change causes each ancestor to go through resolveExit → transition.
3. **Single stamping per change**: `depth` and `nested` are stamped once during the resolveExit chain.
4. **No traversal at read time**: UIs read `state.nested.fullKey` directly.
5. **Immediate wiring**: A → B.C.D.E is fully wired in the same change where B becomes active.

## Testing guidance
- After any `send`, assert `root.getState().nested.fullKey` matches expected path.
- Verify `state.depth` is correctly stamped at each level.
- Verify direct child sends produce identical results to `root.send`.
- Verify every non-root change increments root subscriber call count.
- Verify `child.*` events are handled at immediate parent.

## Migration
- Replace `createHierarchicalMachine(machine)` calls with `propagateSubmachines(machine)`.
- Update inspectors to read `state.nested.fullKey` and `state.depth` instead of traversing.

## Implementation notes
- Use `machine.__propagateUnhook` property to track hook disposer (this is acceptable as part of propagation API).
- Hook/unhook timing is driven by discovery during resolveExit chain, not separate passes.
- No WeakMaps, no Maps, no registries - just direct property on machines that need propagation.
