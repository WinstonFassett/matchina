# HSM Recursion Issue

## Problem
Hierarchical State Machines (HSM) have infinite recursion when child machines reach final states and trigger `child.exit` events.

## Error Details
```
RangeError: Maximum call stack size exceeded
❯ resolveNextState dist/factory-machine.mjs:55:33
❯ Object.resolveExit dist/factory-machine.mjs:32:20
❯ handleReservedEvents dist/hsm/propagateSubmachines.mjs:139:43
❯ handleAtRoot dist/hsm/propagateSubmachines.mjs:151:14
```

## Root Cause
When a child machine reaches a final state:
1. Child sends `child.exit` event to parent
2. Parent's `resolveExit` is called
3. This triggers another `child.exit` event
4. Infinite recursion occurs

## Affected Test
- `test/hsm-checkout-recursion-fix.test.ts` (currently disabled)

## Test Scenario
The HSM checkout machine has a payment submachine. When payment completes:
1. Payment machine reaches `Authorized` (final state)
2. This should trigger transition to `Review` state in parent
3. Instead, infinite recursion occurs

## Current Status
- Basic machines work correctly
- HSM has fundamental recursion issue
- Test disabled to prevent CI failures
- Issue isolated to `propagateSubmachines.ts`

## Fix Needed
The recursion guard needs to be implemented in the HSM event propagation logic, not in the core factory-machine. The issue is in the `handleReservedEvents` and `bubbleChildExitEvents` functions in `propagateSubmachines.ts`.

## Impact
- HSM functionality is broken
- Examples using hierarchical machines will fail
- Core library functionality works fine
