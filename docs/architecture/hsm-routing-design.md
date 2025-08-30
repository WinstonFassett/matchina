# Hierarchical Routing and Parent Actions: Design Discussion

Author: Cascade
Status: Draft for discussion
Scope: FactoryMachine only (no StoreMachine)

## Problem statement

In the checkout demo, while in the `Payment` nested machine, the parent `back` should work, and `proceed` should be blocked until the payment child completes (final). With current child-first routing, parent `back` sometimes doesn’t fire because the child is given priority and appears to "handle" the event.

We need a clean, ergonomic design for hierarchical event routing that:
- Allows parent navigation events (e.g., `back`) to work while nested.
- Gates parent `proceed` until a child final state.
- Avoids ad-hoc functional transitions in the parent.
- Resets child machines on each entry.

## Goals / Non-goals

- Goals
  - Usage-first, ergonomic API surface.
  - FactoryMachine only.
  - Predictable bubbling from child to parent.
  - Simple way to gate proceed on child completion.
- Non-goals
  - A full-blown orchestration DSL.
  - Deeply nested arbitrary broadcast semantics unless selected as a pathway.

## Terms

- Parent: the enclosing machine (e.g., Checkout).
- Child: a nested machine attached to a parent state (e.g., Payment).
- Final child state: the child indicates completion, emitting an exit to parent.

## Current building blocks

- `submachine(createChild, { id? })` puts the child on parent state data under `data.machine` (and optional `id`). File: `src/nesting/submachine.ts`.
- `propagateSubmachines(parent)` enables hierarchical routing and child exit signaling. File: `src/nesting/propagateSubmachines.ts`.
- Demo machine: `docs/src/code/examples/hsm-checkout/machine.ts`.

## Keys: the ground truth for routing

We route and bubble purely by state keys (no functions required):

- __Handled means key changed__
  - Child handles an event only if `before.key !== after.key`.
  - If keys are equal, the event is unhandled and must bubble to the parent.
  - For nested children, also check the nested child’s keys the same way.

- __Why keys (not identity)__
  - Some implementations recreate state objects on send. Identity changes are noise; keys encode semantic state.

- __Parent Back while nested__
  - Child has no `back` transition → child key doesn’t change → event bubbles → parent `Payment: { back: "Shipping" }` runs.

- __Proceed gating__
  - Parent has no `proceed` in `Payment`.
  - Child reaches a final state → completion event raised → parent advances.

- __Completion events (typed)__
  - Emit generic and specific names, analogous to SCXML/XState:
    - `done.state.payment`
    - `done.state.payment.Authorized` (final key appended)
  - Parent maps declaratively:
    - `Payment: { "done.state.payment.Authorized": "Review" }`
    - `Payment: { "done.state.payment.Cancelled": "Shipping" }`

- __Fresh child per entry__
  - Use `submachine(() => createPayment(), { id: "payment" })` so each entry instantiates a new child.

Minimal typed policy surface (helper options):
- `bubbleBy: 'key'` (default) — handled detection via key comparison.
- `parentFirst?: ReadonlyArray<'back' | 'cancel' | string>` — optional allowlist for navigation-like events.

This mirrors standard statechart semantics: inner-first offering, key-based handled detection, bubbling to parent, and done.state completion.

## Design options

### 1) Child-first with robust bubbling (baseline)

- Behavior: parent `.send(type)` first attempts the child; if the child did not transition, let the parent handle it.
- Key challenge: determining whether the child truly "handled" the event.
  - Use state `key` change (not identity) to detect transitions.
  - Optionally consider nested child key changes as handling.
- Pros
  - Keeps child in control of its domain.
  - Simple mental model: child gets first shot.
- Cons
  - Requires careful handled detection; identity-based checks are brittle.
- API knobs (proposed)
  - `propagateSubmachines(parent, { bubbleBy: 'key' | 'identity' })` (default `'key'`).

### 2) Parent-first allowlist/denylist

- Behavior: for specific events (e.g., `back`, `cancel`), parent always handles first.
- Pros
  - Guarantees navigation works regardless of child internals.
  - Very predictable for UX-wide events.
- Cons
  - Slightly more surface area; needs per-event policy.
- API knobs (proposed)
  - `propagateSubmachines(parent, { parentFirst: ['back','cancel'] })`.

### 3) Broadcast to all active machines (sketch.machine style)

- Behavior: dispatch an event to every active machine (parent and child), either in sequence or in parallel, with a policy for conflicts.
- Pros
  - Extremely flexible; no routing ambiguity.
- Cons
  - Harder to reason about ordering, side-effects, and conflicts.
  - Potential double-handling.
- API idea
  - `broadcast: true` with ordering `['child','parent']` or `['parent','child']`.

### 4) Inherited parent actions (shadowing)

- Behavior: child inherits certain parent actions unless it explicitly overrides them.
- Pros
  - Clean semantics; mirrors method inheritance/override.
- Cons
  - Requires richer model of action tables and override detection.
- API idea
  - `inherit: ['back']` with child able to define `back` to shadow.

### 5) Namespaced routing (explicit parent intent)

- Behavior: use explicit event namespaces: `parent.back`, `child.authorize`.
- Pros
  - Zero ambiguity.
- Cons
  - More verbose; changes all call sites.

### 6) Exit signaling and proceed gating

- Child signals completion by entering a final state (e.g., `Authorized: () => ({ final: true })`).
- Parent advances via `
