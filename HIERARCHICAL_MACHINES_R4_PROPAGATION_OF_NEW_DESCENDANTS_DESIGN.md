🧑‍💻 = user/dev/owner whom you should obey and not silenly contradict or defy. questioning and proposing alternatives is ok. but acting against MY wishes without approval is verboten.

# HIERARCHICAL_MACHINES R4 – Propagation Of New Descendants (Authoritative Design)

Status: Draft → Implementable
Owner: Winston / matchina
Scope: FactoryMachine only (exclude StoreMachine)

Hard constraints (MUST)
- Do NOT override getState.
- Do NOT use WeakRefs/WeakMaps.
- Do NOT use private hacky fields or transient flags.
- Do NOT manually call notify; drive changes through first‑class lifecycle only.
- Child‑preference (lowest descendant wins) for routing unknown events. 🧑‍💻: "route" is forbidden. This is not routing. This is handling. and it is child first for all events except for specific known "child.*" events.
- Every non‑root transition must cause each ancestor to pass through its full lifecycle (so UIs/subscribers see consistent "change at root" semantics). 🧑‍💻: FUCK YES THIS IS FUCKING CRITICAL

UI ergonomics (MUST)
- Stamp depth.
- Provide a shared per‑tick nested context on every active state so that UIs never traverse at read time. 🧑‍💻: STOP SAYING TICK AND SAY CHANGE. 
- Access pattern: `const s = machine.getState(); s.depth; s.nested.fullKey; s.nested.stack`. 🧑‍💻: and s.nested.machine and possible s.nested.state, but I guess we can leave the latter off as it's a convenience mostly. But yeah my point is we do not need to override fucking getters, we need to set values. Dead fucking simple vs backwards hacky shit you should never do.  
- The same `s.nested` object instance is shared across all active states for a given tick. 🧑‍💻:  FUCK YES

Terminology
- ~~tick~~ change: one completed handling of a single event starting at the root. 🧑‍💻: CHANGE
- active states (chain): the sequence of currently active states from root to the lowest active descendant.

Public surface used
- `setup(machine)(fn)` and `send(wrapper)`/`resolveExit`/`transition` hooks from existing extension points.
- `submachine(fn, opts)` for declaring nested machines.
- No new public API required for consumers beyond a new optional helper `withHierarchy()` to enable R4 propagation.
🧑‍💻: NO. what is wrong with `propagateSubmachines`?? I fucking required that. 

Key ideas
1) Route at the root always
   - All `send(type, ...params)` calls, regardless of which descendant holds the reference, are forwarded to the root’s routing entry 🧑‍💻: yes so propagate intercepts child.send to call root.send, which should end up calling to child.send again with correct root context and that time it should succeed, coming in as a child-change event to the child where the child can see that it matches the event.   have we defined how child.change works? I don't see it fucking mentioned. What params does it take? I think something like event.to = { type: child.change, send: [type, ...params] }.
   - This is implemented by composing a public send wrapper for each machine during setup, using the existing extension system. No private flags; no identity mutations; no monkey‑patching. 🧑‍💻: this is hand wavy. not clear. But yes none of that shit. Use the `send` hook, i.e. `unhookSendFromThisMachineWhenMachineChangedOrRemoved = sendHook(sendFuncware)(machine)` where sendFuncware is the wrapper that calls root.send. Basically we need to be attaching send hook as soon as we are aware of the machine. not a one-time thing that happens in setup. With a big nested machine it will be CONSTANTLY hooking/unhooking to machines. and be sure to remove it when the machine is removed or changed.

2) Compute once per tick, stamp once per tick 🧑‍💻: tick is not the thing. "change" is the thing. Any change at any level of a hierarchical machine is a change, and all changes must go through the root, and when they do, the stamping must be done. 
   - After the root completes handling an event (including when it delegates to children), execute a single “propagation pass” that:
     a) walks the active chain (bounded by real nesting), 
     🧑‍💻: No. I hate walking. We should only need to walk once, and that will be then it does child-first transitions. Any new states will have gone through that. If we add 10 states, it generally means the active state had a nested machine, so it deferred to that, and that had a nested machine and so on, x10, and so we have ALREADY done the walk. We just need to be sure the results get stamped. maybe there is something about like a nested machine just manifests with a bunch of nested states so we need to support that condition but i think it is going to be unlikely and we should only traverse all the way down once per change. 
     b) builds one immutable `nested` context `{ fullKey, stack }`, and 🧑‍💻: add root `machine` and maybe also its root `state` to this, because it will be immutable. 
     c) stamps `depth` and `nested` onto each active state object for this ~~tick~~ change.
   - No getState overrides. No per‑read stamping. No caches. The walk is O(depth) once per tick. 🧑‍💻: DAMN RIGHT

3) Wire new descendants immediately after parent change
   - When a parent transitions to a state that has (or now reveals) deeper descendants, recursively set up routing wrappers for those descendants during the same propagation pass.
   - This guarantees cases like A → B.C.D.E are fully wired in the same tick where B becomes active, without relying on subsequent UI reads. 🧑‍💻: DO NOTHING IN THE UI. THIS IS ABOUT A SMART CORE FOR UI TO RELY ON 

4) Parent lifecycle on child changes
   - Child transitions are ~~routed up~~ sent (🧑‍💻: don't fucking say 'route' in this doc) to the root first, then down according to child‑preference. Even when the logical parent state key does not change, the parent passes through its lifecycle via the public transition machinery so subscribers see a consistent ~~tick~~ immutable unified comprehensive change event. 

Algorithm (root routing)
- On enable (`withHierarchy`), install a send wrapper at the root using `setup(send(...))`: 🧑‍💻: NO. see above about how your timing for this is stupid and naive. You should be attaching the send wrapper as soon as you are aware of the machine, and detaching, every fuckign time machines change out at any fucking level.
  1) Entry: capture `fromRoot = root.getState()`.
  2) Attempt child‑preference resolve via public `resolveExit` on root – if it resolves to a concrete parent transition, use it.
  3) If unresolved at parent: determine the current active child from `fromRoot.data.machine` and resolve at that child using that child’s public `resolveExit`. Continue down until some machine resolves the event or the chain ends. The first resolver wins (lowest wins).
  4) If a resolver returns an event for its own machine, call that machine’s public `transition(ev)`. 🧑‍💻: No. propagate send hook intercepts sends and if non-root, does not allow it to propagate there, instead calls root.send(ev) and lets whatever happen happen. It is out of its hands at that point. How do we know if we should transition? if root, transition is ok. If non-root, only if propagate's sendhook receives a child.change event should it look and see that the event is targeting ITS machine and then unwrap the actual [event,...params] and actually call child.send. That is the one case, right? I am pretty fucking sure it is.   
  5) Repeat step 3 upward as necessary to process exits (e.g., child final → synthesize `child.exit` at the immediate parent via the parent’s own `resolveExit`, then `transition`). 
  6) After all transitions for this event complete, run Propagation Pass (below) exactly once. 🧑‍💻: NO. what the fuck is that. It is simpler but you must rely on a chain of reactions happening, synchronously, so that things are ALREADY KNOWN TO BE fucking PROPAGATED after the top level call returns. That is the whole fucking point of my elegant fucking design.

Propagation Pass (write‑time; once per tick) 🧑‍💻:  CHANGE not tick. I fucking hate "tick" instead of change. 
🧑‍💻: THIS WHOLE FUCKING THING IS FORBIDDEN. I have explained the walking a dozen times, how it happens in a chain reaction if we do it right. Asshole. Drop this whole fucking section. 
- Goal: stamp depth/nested and wire any newly‑active descendants.
- Steps:
  1) Walk the active chain starting at root by repeatedly reading `getState().data?.machine`.
  2) Build `keys[]` and `states[]` in order; compute `fullKey = keys.join('.')`.
  3) Create a single `nested` object: `{ fullKey, stack: states.slice() }`.
  4) For i in 0..states.length-1:
     - Stamp (mutate) the state object: `state.depth = i; state.nested = nested`.
  5) For each machine in the chain, if its state newly exposes a `data.machine` descendant that does not yet have routing enabled, enable it now by installing that child’s public send wrapper via `setup(send(...))` and by registering it under the same root routing entry.
- Notes:
  - This pass mutates state objects to add `depth` and `nested` only. That is allowed and desired for UI ergonomics.
  - No getState override; we only mutate the already‑returned state objects after the tick’s transitions are finished.

Child‑preference resolution (lowest wins)
- Resolution order during step 3 of root routing:
  - Starting at the lowest active machine, call its `resolveExit({ type, params, from })`. 🧑‍💻: NO FUCK YOU THIS IS WRONG. EVERYTHING HAPPENS FUCKING TOP DOWN. THIS IS NOT FUCKING OPTIONAL. shit gets routed to root machine which then results in a downward cascade of fuckign resolves and back up and when its done, IT IS FUCKING RESOLVED. Semantically this is the place where we are done propagating. Everything is resolved as part of resolveExit and not transition. Transition is actually too fucking late. Because the `to` event is created by `resolveExit` BEFORE calling the rest of the lifecycle. You should read about lifecycle and include it in the next design doc so you are not so fucking ignorant. 
  - If it returns a concrete transition for itself, apply it via that machine’s `transition`. 🧑‍💻: NO. I told you. it should fucking send. THIS IS FUCKING WRONG. STOP DOING HACKY SHIT.
  - If it returns nothing and there is a child, continue downward; otherwise bubble upward to the parent and attempt resolution there. 🧑‍💻:  FUCKING WRONG
  - If a child reaches a final state or loses its `data.machine`, immediately resolve at parent using a synthesized `child.exit` via parent’s public `resolveExit` + `transition`. 🧑‍💻: fucking wrong. 

🧑‍💻: THIS WHOLE SECTION IS FUCKING WRONG AND DEFINITELY FUCKING OVERCOMPLICATING SHIT.


🧑‍💻: MY FUCKING PRINCIPLES:
- non-root sends MUST be blocked and resent through root 
- full machine tree is unknown at any given point and that's fine
- we use normal first class APIs and properties and no hacky shit
- Adding properties states by OUR LIBRARY as part of IMPL is OK. That is not mutation of anything existing. And it is ok while happening within the root resolveExit. 
- ALL fucking downward propagation happens in resolveExit, as a chain, traversin all the way down automatically
- When root.resolveExit is done, everything is fucking resolved and fucking propagated. before we give it back to the consumer. so from their perspective no mutation happens and they receive an immutable state graph/stack. Perfect for our views to traverse WIHTOUT FUCKING WALKING or doing elaborate shit in the view
- child.exit is already handled i think. but basically the propagate should see a child emit that and then send parent.send(child.exit) and those can continue to bubble up until handled. If not handled by root it should still probably culminate in a root change. So basicaly with propagate's help the child.exit should bubble up one parent at a time in a chain reaction until someone can handle it, at which point propagate should basically take that event and call target.send(...childEvent.typeAndParams) and THAT is still wrapped by propagate so that it will send through the root as a child.change. if not we should still send a child.change to root to affect a self transition that may do some sort of cascade. 


New descendants (A → B.C.D.E
🧑‍💻:  as I have said I think propagation pass is unnecessary because resolveExit chain IS the propagation pass.

- When the parent becomes `B`, the Propagation Pass descends from `B` following either:
  - the current active child if present, or
  - the declared initial for submachines reachable from the new state (by reading the active child’s current state, which on brand‑new machines equals their declared initial).
- As the pass walks to `E`, it installs ~~routing~~ send ~~wrappers~~ hooks for each newly discovered machine and includes each state in the shared `nested.stack` it is building. 🧑‍💻: I FUCKING FIXED IT. 

Public‑only discipline
- All interactions use the established public lifecycle:
  - Read state via `getState()`.
  - Compute transitions via `resolveExit()`.
  - Apply via `transition(ev)`. 🧑‍💻: NO. transition is too late. It should happen in resolveExit and send hooks/wrappers mainly
  - Wrap routing using `setup(send(...))` on each machine when it first appears in the chain. send is not needed for just one hook. you can call `unhookSendFromMachine = sendHook(sendware)(machine)`
- No private fields, no special flags, no direct notify calls.

State shape expectations (after a tick)
- Every active state object has:
  - `key: string`
  - `data: any` (possibly includes `machine` for the next descendant)
  - `depth: number` (0 = root)
  - `nested: { fullKey: string; stack: any[] }` – the same object instance across all active states

Performance
- One O(depth) walk per event (tick). No per‑read work. No caches.
- Depth in typical UIs is small; this is plenty.

Testing guidance
- Replace assertions that depended on stamped `fullKey`/`depth` created at read time with assertions that use the post‑tick stamps:
  - After any `send`, assert `machine.getState().nested.fullKey` and `state.depth` at each level.
- Verify new descendant wiring by sending a single event that jumps multiple levels (A → B.C.D.E) and asserting that the very next tick has the full nested context stamped for all levels, and that subsequent child sends route through root correctly.
- Verify that sending directly to a descendant instance also routes through root and produces identical stamps and parent lifecycles.

Out‑of‑scope (R4)
- No inspector‑driven traversal hooks; inspectors should read `state.nested.*` directly after the tick.
- No additional façade utilities beyond the routing wrapper. Keep surface minimal and public.

Migration plan
- Introduce `withHierarchy(machine)` which applies the root routing wrapper and enables R4 propagation behavior. 🧑‍💻: THIS SEEMS TO IGNORE AND COMPETE WITH existing `createHierarchicalMachine`. 
- Ensure `submachine()` usage remains unchanged. 
- Update docs/examples to read `state.nested.fullKey` and `state.depth` post‑send. 🧑‍💻: FOR HIERARCHICAL MACHINES, IF THEY NEED IT. The issue here is more with all the hierarchical inspectors that have fuckloads of inconsistencies and hackery currently. 

Appendix: How to implement without private fields
- Use module‑local maps keyed by machine instances to store routing registrations created by `setup(send(...))`. These are standard Maps (not WeakMaps) owned by the extension module. They are cleared by `disposeAll()` returned by setup when machines are torn down. 🧑‍💻: WHAT THE FUCK DO YOU FUCKING MEAN. I prefer adding properties to instances over fucking weakmaps. I would have hoped this was fucking obvious by now. 
- These registrations are not visible on machine instances and avoid private field pollution, aligning with the no‑private‑fields requirement. 🧑‍💻: We can revisit this later after it fuckign works. 

🧑‍💻: It's not private field pollution if we are making those fields part of the public fucking API when doing fucking nesting.
