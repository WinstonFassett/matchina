🧑‍💻: This is your 3rd attempt at a tech design after having to be corrected profusely 2x in a row. 

I suggest you look at 3.1 to understand what NOT to do. You are forbidden from repeating past mistakes.

# HIERARCHICAL_MACHINES R3.3 – Propagation Of New Descendants (Tech Design)

🧑‍💻: Previous R3 and R3.1 attempts failed; see `HIERARCHICAL_MACHINES_R3_FUCKING_PROPAGATION_OF_NEW_DESCENDANTS_DESIGN_FUCKING_FAIL.md` and `HIERARCHICAL_MACHINES_R3.1_FUCKING_PROPAGATION_OF_NEW_DESCENDANTS_DESIGN_FUCKING_FAIL.md`. R3.2 also failed due to forbidden registry/Map usage; see `HIERARCHICAL_MACHINES_R3.2_FUCKING_PROPAGATION_OF_NEW_DESCENDANTS_DESIGN_FUCKING_FAIL.md`.

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
- Stamp `depth`.
- Provide a shared per‑change `nested` context on every active state so UIs never traverse at read time.
- Access: `const s = machine.getState(); s.depth; s.nested.fullKey; s.nested.stack; s.nested.machine`.
- The same `s.nested` instance is shared across all active states for a given change.

Terminology
- change: one completed handling of a single event starting at the root.
- active states (chain): the sequence of currently active states from root down to the lowest active descendant.

Public surface used
- Existing extension points: `setup(machine)(fn)`, `send(hook)`, `resolveExit`, `transition`.
- `submachine(fn, opts)` for declaring nested machines.
- Helper: `propagateSubmachines(root)` to enable hierarchical propagation. This attaches/detaches send hooks dynamically as machines appear/disappear. No registries.

Design pillars
1) Root‑only entry via send hooks (no registries)
   - `propagateSubmachines(root)` installs a send hook on every known machine so that non‑root sends are blocked and re‑sent to `root.send(...)`.
   - Hooks are attached the moment a machine is discovered in the chain and removed when it leaves. No WeakMaps, no Maps, no hidden registries.

2) Propagation happens in resolveExit chain (no separate pass)
   - The root’s handling of an event performs the full top‑down resolveExit chain, automatically cascading through submachines discovered along the way.
   - When the root’s resolveExit handling finishes, the hierarchy is fully resolved for this change.

3) Stamp once per change
   - During the same root‑handled change, stamp `depth` and a shared immutable `nested` object `{ fullKey, stack, machine }` onto each active state.
   - UIs never traverse at read time.

4) Wire newly active descendants immediately
   - As the resolve chain descends (A → B.C.D.E), each discovered machine gets its send hook attached immediately so the next event is correctly handled child‑first without UI involvement.

Reserved events
- `child.*` are reserved to be handled at the immediate parent.
- `child.exit` is synthesized internally by propagation when a child reaches final or loses its submachine.

Forbidden mechanisms (explicitly NOT used)
- No WeakRefs/WeakMaps, and no module‑local Maps/registries.
- No private/transient flags on instances.
- No manual notify calls; only first‑class lifecycle.

Algorithm (root-orchestrated without registries)

A) propagateSubmachines(root)
- Attach a send hook to `root` that intercepts calls:
  - If `type` starts with `child.`: handle at the immediate parent level (parent‑first) via `resolveExit` then `transition`.
  - Else: treat as a normal event starting at root. Proceed to (B).
- Discover and hook the current active chain starting at root once per change, as part of (B).
- When a machine leaves the chain (child replaced or final), unhook its send wrapper via setup disposer.

B) Root resolveExit chain (child‑first handling, top‑down)
- Read `fromRoot = root.getState()`.
- Resolve at root: `evRoot = root.resolveExit({ type, params, from: fromRoot })`.
- If unresolved at root and the root state exposes a child machine, descend to that child and repeat. The first resolver wins (lowest wins) but resolution occurs via the root‑initiated chain.
- When a machine resolves an event for itself, apply via its public `transition(ev)`.
- If a child reaches final or loses its `data.machine`, synthesize `child.exit` and resolve at the immediate parent using the parent’s public `resolveExit` + `transition`. Repeat upward until stabilized.

C) Single stamping phase (inside the same change)
- Using the already traversed chain from (B), build:
  - `keys = chain.map(s => s.key)` and `fullKey = keys.join('.')`.
  - `nested = Object.freeze({ fullKey, stack: chain.map(s => s), machine: root })`.
- For i in 0..chain.length-1:
  - `state.depth = i; state.nested = nested`.
- Attach send hooks to any newly discovered descendants in this chain so the very next event is correctly intercepted and resent through root if called directly.

Notes
- No registries, no WeakMaps/Maps. Hook/unhook is driven by discovery during normal lifecycle.
- No getState overrides. No manual notify. No transient flags.
- Child‑first handling occurs entirely through public `resolveExit/transition` of the machines in the chain.

Correctness properties
- Direct sends to any descendant instance are effectively re‑sent to the root via the installed send hooks, so behavior matches `root.send`.
- After any change, all active states expose `depth` and the same `nested` object; UIs read without traversal.
- A → B.C.D.E is fully wired in the same change where B becomes active.

Testing guidance
- After any `send`, assert:
  - `root.getState().nested.fullKey` and `.stack.length` matches depth.
  - Depth stamping: `root.getState().depth === 0`, etc.
- Verify direct child sends produce identical results to `root.send` (non‑root send is intercepted and resent at root).
- Verify reserved `child.*` events are applied at the immediate parent.
- Verify every non‑root change causes each ancestor to pass through its lifecycle (root subscriber increments).

Migration
- Introduce `propagateSubmachines(root)` where hierarchical handling is required.
- Update examples and inspectors to read `state.nested.fullKey` and `state.depth` post‑send.

Open questions
- Exact hook attach/detach timing at deep levels when multiple descendants appear in one change; ensure disposers are chained correctly.
- Exact criteria for synthesizing `child.exit` in duck‑typed submachines; keep conservative and documented.
