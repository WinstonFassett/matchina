# Code Review: Hierarchical Routing, Child Exit, and Duck-Typed Support

Date: 2025-08-13

## Summary

This change set improves hierarchical state machine ergonomics and reliability:

- Enables child machines to signal exits to the parent via a normalized `child.exit` path.
- Strengthens child-first routing for both real and duck-typed child machines.
- Preserves parent state identity on self-transitions.
- Adds a realistic checkout flow test to validate exit routing end-to-end.

## Files Reviewed

- `playground/propagateSubmachines.ts`
- `playground/submachine.ts`
- `test/hsm.child-exit-checkout.test.ts`
- `test/hsm.duck-child.test.ts`
- `test/hsm.resolve-exit-and-nesting.test.ts`

## Notable Changes

- **`propagateSubmachines.ts`**
  - Wraps `resolveExit` to ensure `from` and `params` defaults.
  - Parent `send`/`dispatch` now pre-resolve; if `to.key` equals current key, perform no-op to maintain reference identity.
  - Child exit handling: detect exit (no nested machine) and transition parent using `(resolveExit -> transition)` directly, avoiding re-entrant `send` loops.
  - Supports duck-typed children: fast-path routes unknown events directly to `dispatch`/`send` and treats them as handled even with no observable state change.
  - Re-wraps child after parent transitions to account for identity changes.
  - Improves nested child extraction by checking `state.machine`, `state.data.machine`, and `state.data.data.machine`.

- **`submachine.ts`**
  - Adds overload with optional `{ id?: string }` for addressable children.
  - Retains legacy options helper and forwards `id` for compatibility.

- **Tests**
  - `hsm.child-exit-checkout.test.ts`: New scenario validating Shipping -> Payment via `child.exit`, then Payment completion.
  - `hsm.duck-child.test.ts`: Fix assertion to access `dispatched` getter at use-time; validates duck-typed dispatch routing via `routedFacade`.
  - `hsm.resolve-exit-and-nesting.test.ts`: Minor casts to relax typings around facade usage.

## Correctness & Behavior

- All tests pass: 132/132.
- Child exit detection is heuristic (absence of nested `machine`) and works for current usages and tests.
- Duck-typed children receive events even when parent doesn’t know them; parent state remains unchanged unless parent explicitly handles.
- Parent self-transitions preserve identity.

## Risks

- The exit heuristic may misclassify states if a non-exit state intentionally has no nested machine. This matches the current design but may need explicit final-state signaling in the future.
- Direct use of `(machine as any).transition` assumes FactoryMachine compatibility. It’s valid for this codebase; if other machine implementations are introduced, consider a safe fallback.

## Recommendations (Non-blocking)

- Consider a way to opt-in/out of exit detection per state (e.g., `final: true`) to reduce heuristic ambiguity.
- Add lightweight debug tracing utilities to observe child-first routing and exit propagation during development.
- Document addressable child usage patterns (`submachine(..., { id })`) and `routedFacade` ergonomics in a README section with examples.

## Conclusion

The changes are cohesive, minimal at runtime, and improve developer ergonomics significantly. They address previously failing tests and align with the usage-first goals.
