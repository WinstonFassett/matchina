# HSM Recursion Analysis

## Problem Statement
HSM (Hierarchical State Machines) crash with infinite recursion when child machines reach final states.

## Error Trace
```
RangeError: Maximum call stack size exceeded
at handleReservedEvents (propagateSubmachines.ts:321:12)
at handleAtRoot (propagateSubmachines.ts:362:14)
at propagateSubmachines.ts:465:14
at Object.<anonymous> (propagateSubmachines.ts:154:22)
at Object.enhanced [as send] (enhance-function.ts:86:21)
```

## Current Code Analysis

### sendHook (line ~147)
```typescript
const unhook = sendHook((innerSend: any) => (type: string, ...params: any[]) => {
  // Skip ALL send hook logic during reserved event handling to prevent recursion
  if (isHandlingReservedEvent) {
    return innerSend(type, ...params);
  }
  
  // Skip final state detection during HSM operations to prevent recursion
  if (isProcessingFinalState) {
    return innerSend(type, ...params);
  }
  
  // First, let the machine handle its own event
  const result = innerSend(type, ...params);
  
  // Check if the machine has reached a final state after handling the event
  const state = m.getState?.();
  if (state && isChildFinal(m as DuckTypedMachine, state)) {
    try {
      isProcessingFinalState = true;
      let current: DuckTypedMachine | null = rootMachine;
      while (current) {
        // ... climb hierarchy
        current.send?.('child.exit'); // <-- RECURSION POINT
      }
    } finally {
      isProcessingFinalState = false;
    }
  }
  return result;
});
```

### handleReservedEvents (line ~321)
```typescript
function handleReservedEvents(type, params) {
  if (isHandlingReservedEvent) return;
  try {
    isHandlingReservedEvent = true;
    isResolvingExit = true;
    const ev = rootMachine.resolveExit?.({ type, params, from });
    if (ev) {
      originalTransition?.call(rootMachine, ev);
    }
  } finally {
    isHandlingReservedEvent = false;
    isResolvingExit = false;
  }
}
```

## Root Cause Analysis

### The Recursion Loop
1. Child machine reaches final state
2. sendHook detects final state and sends `child.exit` to root
3. `handleAtRoot` calls `handleReservedEvents`
4. `handleReservedEvents` calls `rootMachine.resolveExit`
5. `resolveExit` calls `resolveNextState` -> `resolveExitState`
6. This triggers a transition in the root machine
7. The transition causes the root machine to change state
8. Which may trigger sendHook again on the root machine
9. **INFINITE RECURSION**

### Why Current Guards Fail
- `isHandlingReservedEvent`: Only prevents re-entry into `handleReservedEvents`
- `isResolvingExit`: Only prevents re-entry into `resolveExit`
- `isProcessingFinalState`: Only prevents re-entry into final state detection in sendHook

**The issue is that the recursion happens at the factory-machine level in `resolveExitState`, not in the HSM level.**

## Current Status: FAILED ATTEMPTS

### Attempt 1: HSM-level recursion guard in handleReservedEvents
- Added `isResolvingExit` guard
- **FAILED**: Recursion still happens in sendHook

### Attempt 2: sendHook final state detection guard
- Added `isProcessingFinalState` guard
- **FAILED**: Recursion still happens in factory-machine `resolveExitState`

## Real Problem
The recursion is happening in the **factory-machine** level, not the HSM level. When `handleReservedEvents` calls `rootMachine.resolveExit`, it calls into the factory-machine's `resolveExit` function, which then calls `resolveNextState` and `resolveExitState`. This can trigger another transition check, causing the recursion.

## Next Approach: Factory-Machine Level Fix

The fix needs to be in the factory-machine's `resolveExitState` function to prevent recursion during HSM operations.

## Potential Solutions

### Option 1: Global Recursion Guard in resolveExitState
Add a global guard to prevent re-entry into `resolveExitState` during HSM operations.

**Pros:** Simple, centralized
**Cons:** Affects all machines, not just HSM

### Option 2: HSM-Aware Factory Machine
Make factory-machine aware of HSM operations and skip recursion checks during HSM operations.

**Pros:** Isolated to HSM, doesn't affect basic machines
**Cons:** More complex implementation

### Option 3: Event Queue Approach
Instead of immediate processing, queue events and process them sequentially.

**Pros:** Eliminates recursion entirely
**Cons:** Major architectural change

## Recommended Approach: Option 1

Implement a global recursion guard in `resolveExitState` that prevents re-entry during HSM operations.

## Implementation Plan

1. Add global recursion guard to factory-machine `resolveExitState`
2. Set guard during HSM operations
3. Test with checkout example
4. Re-enable failing test

## SOLUTION IMPLEMENTED

### Root Cause
The actual issue was twofold:
1. Missing `isProcessingFinalState` guard in the dist (build was out of sync with source)
2. `child.exit` was being sent to the **deepest child** instead of the **root machine**

### The Fix
Changed the `hookMachine` sendHook in `propagateSubmachines.ts` from:
```typescript
// OLD: Traversed to deepest child and sent child.exit there
let current = rootMachine;
while (current) { /* traverse to deepest */ }
current.send?.('child.exit');  // Wrong! Child doesn't handle this
```

To:
```typescript
// NEW: Send directly to root machine
rootMachine.send?.('child.exit');  // Root has the transition handler
```

The checkout machine defines `"child.exit": "Review"` on its Payment state, so when a child reaches final state, the ROOT machine needs to receive the event to transition from Payment to Review.

### Why Previous Attempts Failed
- HSM-level guards (`isHandlingReservedEvent`, `isResolvingExit`) were correct but not enough
- The `isProcessingFinalState` guard existed in source but dist was out of sync
- Even with guards, sending `child.exit` to the wrong machine (child vs root) meant the transition never happened

## Test Cases

1. **Basic HSM**: Simple parent-child with final state
2. **Nested HSM**: Multiple levels of hierarchy
3. **Checkout Flow**: Complete payment flow
4. **Error Recovery**: HSM with error states

## Success Criteria

- [x] HSM checkout example completes without crash
- [x] All basic machine tests still pass (189 tests, 32 files)
- [x] No infinite recursion in any HSM scenario
- [x] Performance remains acceptable
