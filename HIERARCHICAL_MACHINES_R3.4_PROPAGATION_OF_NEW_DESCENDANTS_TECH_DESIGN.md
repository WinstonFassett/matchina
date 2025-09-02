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
- Attach send hook to root that handles child.* events at parent level
- Hook intercepts child.* events and handles them via resolveExit → transition at root level
- Normal events proceed to root resolveExit chain
- Hook any currently active descendants

### B) Root resolveExit chain (child-first, with stamping)
- Build chain during resolution by collecting states as we descend
- Use normal resolveExit/transition lifecycle - no custom chain walking
- After resolution, stamp depth and nested on all states in the chain
- Hook any newly discovered machines
- Child-first resolution: try child.resolveExit first, then parent if unresolved

### C) Send hook mechanics
- Walk current active chain and hook each discovered machine
- Each hooked machine intercepts sends and redirects non-child.* events to root as child.change
- child.* events are handled at the machine's own level
- Use machine.__propagateUnhook property to track hook disposer

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
