🧑‍💻 = owner remarks

# HIERARCHICAL_MACHINES R3 – Propagation Of New Descendants (Design)

Status: Draft
Owner: Winston / matchina
Scope: FactoryMachine only (no StoreMachine)
Constraints: NO getState overrides. NO WeakRefs. NO stamping or mutating user-visible state objects. NO caches. Brand-first with duck-typed fallback.

## Problem Statement

~~
We need hierarchical event routing where a parent can:
- Route unknown events to the currently active child (child-first option) and have effects bubble up.
- Receive child-originated events and decide to handle them at the parent or delegate back down.
- Detect child exits (including duck-typed submachines) and transition accordingly.
- Notify parent subscribers when a child changes even if the parent state identity does not change.
~~

🧑‍💻: NO. THIS IS FUCKING WRONG. SHIT REALLY. Here is what we fucking have and what we NEED:

- we have incomplete propagation
- you are trying to be too fucking clever and imperative instead of smart and elegant
- what works now is child-preference for transitions, which means lowest child wins
- we have some stack updates working 
- but propagate is not aware of newly created machines that themselves may have submachines etc
- if we go from A to A.B.C2, our child pref stuff does childFirst transition and is thus aware of everything down to C2
- but if we go from A to B.C.D.E, it currently does not pick it up. well you fixed it int he UX to do it but that is the wrong place, as is hacking getState, which is absolutely forbidden.


YOU MUST NOT hack getState. You MUST NOT use WeakMaps or weak refs to do tracking than can be done through normal means.

I have thought through it all. 12 hours ago. You must not defy me. You are making guesses based on averages in your training whereas I am using fucking LOGIC. 

All of this must be implemented without overriding `getState()`, without WeakRefs, without mutating state objects to add fields like `fullKey/depth/stack`, and without caching.

If you get the TIMING and state placement right you should not need fucking hacks.


## Definitions and Allowed Internal Fields

Allowed private fields on machines (internal wiring only):
- `__parentMachine: FactoryMachine<any> | undefined`
- `__rootMachine: FactoryMachine<any>`
- `__parentNotify?: (ev: any) => void` – bubble notifications to ancestors
- `__handleFromChild?: (type: string, ...params: any[]) => void` – root-level hook exposed to children via `enhanceSend`
- `__innerSend?: (type: string, ...params: any[]) => void` – captured inner send used by parent routing
- Transient flags during a single send invocation only:
  - `__fromParent` (boolean)
  - `__suppressChildNotify` (boolean)

No other private fields. No WeakSets. No state mutation.

🧑‍💻: NO. AGAIN, PERFECTLY AGAINST MY FUCKING WISHES. FUCK YOU. I PREFER PUBLIC INTERFACES TO HACKY PROPERTIES

THIS IS A FUCKING ABOMINATION, this section.

## Detection: Child Machine (Brand-first, Duck Fallback)

Given a parent state `S`, the active child machine is:
- Prefer `isFactoryMachine(S?.data?.machine)`.
- Duck-typed fallback: `typeof m.getState === 'function' && typeof m.send === 'function'`.

If neither, there is no child.

🧑‍💻: this makes no fucking sense. Branding has nothing to do with propagation. Nor does duck typing.

## Wiring: Propagation

When a machine is set up via `propagateSubmachines(parent)`:
1. Set pointers:
   - `parent.__rootMachine = parent.__rootMachine ?? parent` if root.
   - `child.__parentMachine = parent` and `child.__rootMachine = parent.__rootMachine` when a child is discovered.
2. Recursively call `propagateSubmachines(child)` once when a child becomes the active descendant.
3. For FactoryMachine children, wrap their `send` via `enhanceSend(child, parent)` using `buildSetup(child)` so that child-originating events can route up to root `__handleFromChild`.

Discovery moments (no polling, no getState override):
- Eager on parent setup: inspect `parent.getState()` once and wire if a child exists.
- After any parent transition (in parent send wrapper), inspect `parent.getState()` again and wire if a new child is now active.

Heuristic to avoid re-propagation without WeakRef: check `child.__parentMachine` presence. If not set, wire it. This is stable because child instances are stable per active state.

🧑‍💻: NO. FAIL. THIS IS TERRIBLE. TOTAL FAIL. FUCK THIS. FORGET THIS APPROACH.

YOU ARE NOT WRONG TO WANT SOME OF THIS BUT YOU DO IT IN THE WRONG FUCKING PLACE TOO MUCH.

## Routing Semantics

There are two entry points where routing can happen:

1) Parent’s own `send` (wrapped by `buildSetup(send(...)))`:
- Try child-first delegation:
  - Read `parentState`, get `child`.
  - Snapshot child state before. 🧑‍💻: I FUCKING HATE SNAPSHOTTING. THIS INDICATES FUCKERY. MISUNDERSTANDING. STUPIDITY.
  - Temporarily set flags `child.__fromParent = true` and `child.__suppressChildNotify = true`. 🧑‍💻: I also hate this
  - `child.send(type, ...params)`; finally remove flags. 🧑‍💻: fuck this approach.
  - Snapshot child state after; if (a) child key changed or (b) grandchild changed, consider it handled (duck fallback: any successful call counts as handled). 🧑‍💻: FUCK SNAPSHOTTING.
  - If handled:
    - If looks like exit (see Exit Detection below), synthesize and process `child.exit` at parent via `resolveExit` + `transition`.
    - Else notify parent subscribers of `child.changed`. 🧑‍💻: FUCK YOU. IT should be `child.change` because it can't change until it goes through the fucking root and gets propagated. My whole fucking point. 
    - Return (stop; do not process at parent).
- If not handled by child:
  - Normalize event at parent: `resolveExit({ type, params, from: parent.getState() })`.
  - If it resolves to parameterless self-transition, no-op; otherwise call `innerSend(type, ...params)`.
  - After parent handles, re-discover a newly active child and wire pointers if present.

  🧑‍💻: I do not follow this. But if it is NOT a child transition, we need to traverse down any children of the state at the level that changed, and update stack and fullKey for the whole stateset. and this should not require iterating or hacking getstate. instead, everything should go on the hierarchical context obj, the stack or whatever. maybe we call it nested. state.depth, state.nested.fullKey, state.nested.stack. The idea is that all states of the machine have the exact same `nested` instance each time a change happens. And then when you traverse to that you get the fullKey there, so we DO NOT need any FUCKING monkeypatching or stupid fucking overrides that are shitty code smells.

2) Child-originating events (UI holds child reference and calls `child.send(...)` directly):
- `enhanceSend(child, parent)` intercepts child sends.
- If `child.__fromParent` is true (parent-delegated), call the child’s original send directly. 🧑‍💻: WTF DOES THIS MEAN. I hate stupid properties when we can figure this shit out. 
- Else, forward to root handler: `root.__handleFromChild?.(type, ...params)` or fallback to `parent.send(type, ...params)` if no handler.
- Root `__handleFromChild` attempts parent handling first; if parent didn’t change, it delegates back down to the active child with transient flags identical to (1) above, then performs exit/notify as appropriate.

Note: Transient flags are always set/cleared in a try/finally to avoid leaks. 🧑‍💻: FUCK TRANSIENT FLAGS.

🧑‍💻: THIS IS A SHITTY HACKY APPROACH SO FAR.



## Exit Detection

We consider a child transition as an exit signal for the parent if any of the following holds:
- Factory or duck child reports `after.data?.final` true.
- The child lost its `data.machine` (had machine before, none after).
- The grandchild became final.
- Duck fallback only: if `after.data` exists but no `machine`, treat as a data-state exit (optional setting retained to true for compatibility).

On exit, parent synthesizes:
```
resolveExit({
  type: 'child.exit',
  params: [{ id: parentState.data?.id ?? parentState.id, state: after.key, data: after.data }],
  from: parent.getState(),
})
```
If an event is returned, parent `transition(ev)`.

🧑‍💻: cautiously, this seems ok. 

## Notifications

- For non-exit child changes, parent calls `parent.notify({ type: 'child.changed', from, to: from, params: [{ id, child: after.key }], machine: parent })` and then bubbles upward via `__parentNotify`.
- For parent changes (due to its own transitions or child exit), parent’s normal notify path already triggers.

🧑‍💻: NO FUCK YOU. I KEEP FUCKING TELLING YOU NOT TO HACK MY SHIT. We have fucking send methods and transition methods and other shit. Use the first class API instead of manually calling just part of the fucking lifecycle. This will fucking fail. 

## Path/Key Computation

- We do NOT stamp `fullKey`, `depth`, or `stack` onto states. 🧑‍💻: WRONG. We must stamp depth. That varies. 
- UIs/Test code should call a pure helper like `readHierarchicalFullKey(root)` which walks down the chain via `getState().data?.machine`, collecting `.key` on demand. 🧑‍💻: WRONG. FUCK. THIS IS THE WHOLE FUCKING POINT OF MY PRECIOUS FUCKING DESING, to avoid runtime fucking walks by the fucking UI. JESUS FUCK. 
- No caching; each call is O(depth) and safe.

## API Surface

- `createHierarchicalMachine(machine)` – wraps a `FactoryMachine` to enable propagation. Uses `propagateSubmachines(machine)(machine)` internally. 🧑‍💻: I don't give a fuck about this, the problem is in propagate.
- No changes to user-facing `getState()` or `send()` semantics. 🧑‍💻: DAMN FUCKING RIGHT.
- Optional: `readHierarchicalFullKey(machine)` utility (already exists) for UI/tests. 🧑‍💻: NO. THIS IMPLIES THAT it is not EASY to read the full key. Our whole fucking purpose here is to make it dead fucking simple with no fucking walking because it will be on the fucking nested stack/state that is the SAME for EVERY FUCKING ACTIVE STATE. LITERALLY IT SHOULD BE AS FUCKING EASY AS machine.getState().nested.fullKey. FUCKER. JFC. FUCK MY LIFE.

## Algorithm Sketch (Pseudocode)

Parent wrapper (simplified):
```
setup(send(inner => {
  root.__innerSend = inner
  root.__handleFromChild = (type, ...p) => {
    const beforeParent = getState()
    try parentFirst(type, p)
    const afterParent = getState()
    if (beforeParent.key !== afterParent.key) return
    delegateToChild(type, p)
  }

  return (type, ...p) => {
    if (childFirst(type, p)) return
    const from = getState()
    const resolved = resolveExit({ type, params: p, from })
    if (!selfNoop(resolved, from, p)) inner(type, ...p)
    wireNewChildIfAny() 🧑‍💻: REALLY it is more like wireAnyNewDescendantsOfChangedState
  }
}))
```

Child-first and delegate use the same mechanics: transient flags, send, compare before/after, exit/notify.

🧑‍💻: AGAIN, NO FUCKING FLAGS. NO FUCKING NOTIFY. FUCK YOU ARE SO FUCKING OFF WITH THIS SHIT.

## Invariants

- Never override `getState()`.
- Never mutate state objects (no stamping fields).
- Never use WeakRefs or WeakSets.
- Only allowed persistent private fields are pointers and bubble hook, plus the `__handleFromChild` function and `__innerSend` reference. 🧑‍💻: THESE SEEM UNFUCKING NECESSARY TO ME.
- Transient flags must be set and cleared within the same call frame. 🧑‍💻: AGAIN FUCK THESE FLAGS. NO.

## Duck-typed Safety

All routing uses `try/catch` around duck-typed children so that misbehaving third-party machines cannot crash the parent.

## Testing Implications

- Assertions must not rely on stamped fields like `fullKey`, `depth`, or `stack` on state objects. 🧑‍💻: WHY THE FUCK NOT?
- Use `readHierarchicalFullKey(root)` to verify active path. 🧑‍💻: FUCK. JFC. NO. NO NO NO. NO FUCKING TRAVERSAL IT SHOULD BE DEAD FUCKING SIMPLE. A FUCKING PROPERTY THAT IS ALREADY FUCKING SET. ASSHOLE> 
- Parent subscriber expectations remain valid:
  - After a child-only transition, expect at least one parent notify. 🧑‍💻: after any fucking non root transition, EVERY FUCKING PARENT MUST FUCKING CHANGE AND GO THROUGH ITS FULL FUCKING LIFECYCLE. 
  - After an exit, expect parent transition and notify. 🧑‍💻: NO FUCKING NOTIFY. JESUS FUCK.

## Migration Notes

- Remove any test or UI references to `state.fullKey`, `state.depth`, `state.stack`. 🧑‍💻: Um I still want this shit in the UI. But yeah it should be like, state.depth and state.nested = { fullKey, stack }. but actaully mabe should be more like state = { depth? root?: state = { key, data, nested: { fullKey, stack } }} and so instead of putting fullKey on everything, we put the root on everything, so to get fullkey for any state you could do state.root.fullKey, state.root.stack etc
- Replace with `readHierarchicalFullKey(root)`. 🧑‍💻: NO NO NO. 
- No changes required to machine definitions. 

## Non-Goals (R3)

- No global stacks or ambient context.
- No custom facade API beyond the minimal pointers and routing.
- No performance caching; correctness > micro-optimizations. Depths are small in typical UIs.

## Risks & Mitigations

- Nested child sends could cause re-entrancy if flags leak: we always clear flags in finally blocks. 🧑‍💻: FUCK NO FLAGS.
- Duck-typed children may not surface finality consistently: we keep conservative exit heuristics and guard with try/catch.

## Example: Checkout → Payment (Happy Path)

- Root in `Checkout.Payment.MethodEntry`.
- UI calls `root.send('authorize')`. 🧑‍💻: NO. the problem is when ui calls someDescendant.send(stuff)
- Parent tries child-first: delegates to `payment.send('authorize')` with transient flags. 🧑‍💻: YOU SKIPPED THE PART WHERE CHILD REROUTES NON ROUTE CALLS UP TO ROOT. 
- Payment goes `Authorizing` → handled; not exit.
- Parent notifies `child.changed` and returns. 🧑‍💻: child.change is a request. it can't change unless root allows it. 
- `readHierarchicalFullKey(root)` now yields `Checkout.Payment.Authorizing`. 🧑‍💻: again, fuck this function.

## Example: Payment final → Parent exit

- Payment transitions to `Authorized (final)` internally.
- Parent detects final in child-first or in `__handleFromChild` path and synthesizes `child.exit`. 🧑‍💻: fuck flags and this happens in propagate. parent doesn't detect shit. propagate handles it all. parent is fucking agnostic. 
- Parent transitions `Checkout.Payment → Checkout.Review`.

🧑‍💻: THIS PART FUCKING WORKED ANYWAY. THE WHOLE PROBLEM IS THE PREVIOUS FUCKING SECTION when you send "authorize" to non-root.

---

This document is the contract for the R3 implementation. Any code must adhere strictly: no getState overrides, no WeakRefs, no stamping, no caches. If additional capabilities are needed, they must be proposed here first.

🧑‍💻:  THIS DOCUMENT IS SHIT AND SHOULD BE COMPLETELY REWRITTEN AS A NEW VERSON, PRESERVING THE UTTER SHITTINESS OF THIS ONE AS A FUCKING LESSON.