🧑‍💻: This document is a FAILURE. Renamed from R3.2 tech design due to forbidden hierarchyRegistry usage (module-local Map). WeakMaps and Maps for instance tracking are both forbidden and hacky. Design direction rejected.

# HIERARCHICAL_MACHINES R3.2 – Propagation Of New Descendants (Tech Design) — FUCKING FAIL

Status: Rejected (see R3.3)
Owner: Winston / matchina
Scope: FactoryMachine only (exclude StoreMachine)

Why this fails
- Introduces a module-local `hierarchyRegistry` Map to track machines → root orchestrator.
- Violates the explicit constraint: NO WeakRefs/WeakMaps; and using a normal Map isn’t better — it’s the same hack in different clothing.
- Leans on a post-change “Propagation Pass” traversal instead of letting resolveExit perform the propagation chain synchronously.
- Adds indirection that competes with the desired simple, root-orchestrated, public-API-only approach via send hooks.

Original (for historical reference only) follows below.

---

🧑‍💻: This is your 3rd attempt at a tech design after having to be corrected profusely 2x in a row. 

I suggest you look at 3.1 to understand what NOT to do. You are forbidden from repeating past mistakes.

# HIERARCHICAL_MACHINES R3.2 – Propagation Of New Descendants (Tech Design)

Status: Draft → Implementable
Owner: Winston / matchina
Scope: FactoryMachine only (exclude StoreMachine)

Hard constraints (MUST)
- Do NOT override getState.
- Do NOT use WeakRefs/WeakMaps.
- Do NOT add private fields on machine instances.
- Do NOT use transient flags.
- Do NOT manually call notify; use first‑class lifecycle only (resolveExit → transition).
- Child‑first handling for all events, except reserved "child.*" which are handled at the immediate parent.
- Every non‑root change causes each ancestor to pass through its full lifecycle (so the root observes a change consistently).

UI ergonomics (MUST)
- Stamp depth.
- Provide a shared per‑change nested context on every active state so UIs never traverse at read time.
- Access: const s = machine.getState(); s.depth; s.nested.fullKey; s.nested.stack; s.nested.machine.
- The same s.nested instance is shared across all active states for a given change.

Terminology
- change: one completed handling of a single event starting at the root.
- active states (chain): the sequence of currently active states from root down to the lowest active descendant.

Public surface used
- Existing extension points: setup(machine)(fn), send(wrapper), resolveExit, transition.
- submachine(fn, opts) for declaring nested machines.
- New helper (internal to nesting module): withHierarchy(machine) to enable this behavior (idempotent).

Design pillars
1) Root‑orchestrated handling (no instance hacks)
   - All send(type, ...params) calls are handled by the root’s orchestrator, even when a descendant holds the reference.
   - Achieved via a public send wrapper installed at setup for every machine that participates in hierarchy.
   - No flags, no private props. A module‑local registry maps any participating machine → its root orchestrator.

2) Compute once per change; stamp once per change
   - After handling completes, run a single propagation pass that builds one immutable nested object { fullKey, stack, machine } and stamps it along with depth on each active state.
   - No per‑read work. No caches. No mutations during reading.

3) Wire newly active descendants immediately
   - During the propagation pass, as we walk down from the root through state.data?.machine, we install send wrappers for any newly encountered machines so that the very next change can be handled correctly (A → B.C.D.E).

Reserved events
- child.* are reserved to be handled at the immediate parent (parent‑first for those only).
- child.exit is synthesized internally when a child reaches final or loses its submachine; not intended for user code to emit directly.

Module‑local registry (no private fields)
- Maintain hierarchyRegistry: Map<object, { root: object; handleAtRoot: (type: string, ...p: any[]) => any }> in the nesting module.
- On withHierarchy(root), register { root, handleAtRoot } for root and for any descendants as they are discovered.
- On teardown via the module’s integration with setup(...).disposeAll, remove entries to avoid leaks.

Algorithm
A) withHierarchy(root)
- If hierarchyRegistry.has(root), return root (idempotent).
- Install root send wrapper using setup(send(wrapper)):
  - Capture innerSend for root to call its own transitions.
  - Define handleAtRoot(type, ...params) that executes the Root Handling Loop (B).
  - Return a function (type, ...params) used as the machine’s public send wrapper:
    - If type matches child.*, handle parent‑first at this level (via resolve/transition), then run Propagation Pass (C), and return.
    - Otherwise, delegate to handleAtRoot(type, ...params).
- Register { root, handleAtRoot } for root in hierarchyRegistry.
- Eagerly call wireDescendants(root) once (see C.3) so direct child references already forward to root.

B) Root Handling Loop (child‑first handling)
- Input: type, params.
- Step B1: Build the current active chain (machines and states) by:
  - Start at m = root.
  - While true: s = m.getState(), push { m, s }.
  - If s.data?.machine exists and is a machine, set m = s.data.machine and continue; else break.
- Step B2: Try to resolve and apply the event from lowest to highest:
  - For i from deepest to 0:
    - Let { m, s } = chain[i].
    - If type is reserved child.* and i < deepest, skip (parent‑first only at the level the event arrived).
    - Call ev = m.resolveExit?.({ type, params, from: s }).
    - If ev exists and targets m (including self with params), call m.transition(ev) and mark handled = true; break.
- Step B3: If not handled at any level:
  - No transitions occur; run Propagation Pass (C) and return.
- Step B4: While exits are pending upward:
  - Recompute the local child state for the parent that just processed a transition; if that child is final or no longer present, synthesize child.exit for the parent via the parent’s resolveExit + transition.
  - Repeat upward until no more parent exits occur.
- Step B5: Run Propagation Pass (C) and return.

C) Propagation Pass (post‑change stamping and wiring)
- C1: Rebuild the active chain (states and machines) from root as in B1.
- C2: Compute keys = chain.map(({ s }) => s.key) and fullKey = keys.join('.').
- C3: Wire descendants: for each { m } in the chain (excluding root itself which is already wired), if !hierarchyRegistry.has(m), install its public send wrapper as:
  - setup(send(childInner => (type, ...p) => { if (type.startsWith('child.')) return handleHere(type, p); const reg = hierarchyRegistry.get(m) || hierarchyRegistry.get(root); return reg!.handleAtRoot(type, ...p); })).
  - Register { root, handleAtRoot } for m in the registry.
  - handleHere implements parent‑first handling for reserved child.* at that level using resolveExit/transition then returns.
- C4: Build one nested object: const nested = Object.freeze({ fullKey, stack: chain.map(({ s }) => s), machine: root });
- C5: For i in 0..chain.length-1:
  - Mutate state object s: s.depth = i; s.nested = nested.

Notes
- No machine instance fields are added; the only mutations are to state objects returned by getState() after the change has concluded.
- The registry is module‑local. No WeakMap; cleanup via disposers returned from setup.
- Child‑first handling occurs entirely through public resolveExit/transition of the machines in the chain; there is no diff/snapshot heuristic.

Correctness properties
- Direct sends to any descendant instance are handled by the root (through the registry‑installed wrapper), so behavior is identical to calling root.send.
- After any change, all active states expose depth and the same nested object; UIs read without traversal.
- A → B.C.D.E is wired in the same change where B becomes active; the next event is child‑first across the newly discovered chain.

Testing guidance
- After any send, assert:
  - root.getState().nested.fullKey === '...' and .stack.length equals depth.
  - Depths: root.getState().depth === 0, etc.
- Verify direct child sends produce identical results to root.send.
- Verify reserved child.* events are applied at the immediate parent.
- Verify parent lifecycle fires on child‑only changes (e.g., increment call count of root subscribers).

Migration
- Introduce withHierarchy(machine) at creation sites that need hierarchical handling.
- Update examples and docs to read state.nested.fullKey and state.depth post‑send.

Open questions (to resolve during implementation)
- Disposer threading: ensure registry entries are removed when a machine is torn down; verify setup’s disposeAll is invoked reliably for submachines.
- Exact criteria for synthesizing child.exit in duck‑typed submachines; keep conservative but documented.
