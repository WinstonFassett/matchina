# `propagateSubmachines` Refactor TODO

This document tracks the status of the refactoring work on `propagateSubmachines.ts` based on comments and feedback.

## Summary

While several cleanup and documentation tasks were completed, a key piece of feedback regarding event handling remains unaddressed due to regressions it introduced. The current implementation, while functional and passing tests, still relies on a `notify` mechanism that was flagged as "weird."

## Addressed Items

- **✅ Cleanup Logic Restored**: The `dispose` function and `hookedMachines` set have been restored. The system now tracks hooked machines and provides a cleanup function to unhook them, preventing memory leaks.
- **✅ Documentation Added**: Explanatory comments have been added to the monolithic `handleAtRoot` function to clarify its child-first traversal and event bubbling logic.
- **✅ Minor Refactors**: Comments regarding the placement of `stampUsingCurrentChain` and its argument-less nature were addressed with code changes and explanations.

## Remaining Task: Improve Child Change Notification

The most significant remaining issue is the way child machine changes are communicated to the root. The current implementation uses `root.notify(...)`:

```typescript
// In handleAtRoot(...)
if (result.handled && !String(type).startsWith('child.')) {
  (root as any).notify?.({ type: 'child.change', params: [{ target: result.handledBy, type, params }] });
}
```

**The Problem:**

This feels like an explicit, manual notification that sits outside the machine's natural event lifecycle. The original comment expressed a preference for a solution that uses the standard `send` or `transition` flow.

**The Challenge:**

An attempt to replace `notify` with an internal `root.send('child.change', { _internal: ... })` call led to test failures (`hsm.simple-child-exit.test.ts`). The interaction between the `send` hook, the `handleAtRoot` function, and the `child.exit` bubbling is delicate. A change in one area can have unintended consequences.

**Resolution:**

Implemented internal routing via `root.send('child.change', payload)` in `src/nesting/propagateSubmachines.ts`:

- Non-root sends are redirected to root as `child.change`.
- When the payload includes `{ _internal: true }`, the root short-circuits to `root.notify(...)` to surface the change to subscribers without re-entering `handleAtRoot`, preventing recursion.
- External `child.change` (no `_internal`) is treated as a routed event and processed through `handleAtRoot(childType, childParams)`.

All tests pass, including `hsm.simple-child-exit.test.ts`. The manual `notify` call inside `handleAtRoot` was removed in favor of `root.send('child.change', { ... , _internal: true })`.
