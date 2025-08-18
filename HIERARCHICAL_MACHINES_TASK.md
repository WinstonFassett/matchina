# Task: Make Hierarchical State Machines

This  is a state machine library with strong typing, backed by a core change machine whose core state is the lastChange={type,from,to}, where to is current state and from is past state and type is event key dispatched/sent.

We have store machines that have just a single state type and typed events with names and args, and we have state machines that have multiple defined states types, where each state is an object with a `key`.

The docs astro site here has tons of examples in src/code/examples/. It follows a format of example.tsx for the docs to use for live example hosting, and index.tsx for them NOT to use but to provide for users in the code snippets to use instead of the example.tsx. There are react examples and raw usage examples. And many mdx docs in content/docs/.

This library relies heavily on type aliases and pattern matching for strong type inference. Fundamentally it uses the matchbox factory pattern (my term) where we have factories for keyed state objects as described above, and those factories improve the ergonomics of defining and using state machines and stores.

basic patterns are

const storeMachine = createStoreMachine(initialState, { ...events: (state) => updatedState })
const states = defineState({ A: undefined, B: () => ({ date: new Date() }), C: (x,y) => ({ x,y })})
const stateMachine = createMachine(states, {
  A: { thing: "B", otherThing: "C" },
  B: { otherThing: "C" },
  C: { anotherThing: "A" },
}, "A")
setup(stateMachine)(effect(fn), ...etc)
stateMachine.send("thing")
stateMachine.getState().key // "B"
const stateMachineApi = eventApi(stateMachine)
stateMachineApi.otherThing("x", "y")
const fancyMachine = addEventApi(stateMachine)
fancyMachine.otherThing("x", "y")
(fancyMachine || (stateMachine as typeof fancyMachine)).thing()

All machines get lifecycle methods assigned to them at creation. All transitions and updates go through these lifecycle methods and we provide setup and hooks functions for each lifecycle method on the machine. Such that we can set up disposable machine effects and guards with things like

unsetup = setup(machine)(
  guard(ev => true),
  effect(ev => {}),
)

So the state machine mechanisms are pretty lightweight right now. 

Here is how we create a lifecycle:

```ts
function createUpdateLifecycle<E, T extends object = any>(
  update: EffectFunc<E>,
  target: T = {} as any
): EventLifecycle<E> & T {
  const lifecycle: EventLifecycle<E> & T = Object.assign(target, {
    guard: EmptyGuard,
    handle: EmptyTransform,
    before: EmptyTransform,
    update: (ev: E) => update(ev),
    effect(ev: E) {
      lifecycle.leave(ev); // left previous
      lifecycle.enter(ev); // entered next
    },
    leave: EmptyEffect,
    enter: EmptyEffect,
    notify: EmptyEffect,
    after: EmptyEffect,
    transition(ev: E) {
      if (!lifecycle.guard(ev)) {
        return;
      }
      let output = lifecycle.handle(ev);
      if (!output) {
        console.log("Transition aborted by handle", ev);
        return;
      }
      output = lifecycle.before(output);
      if (!output) {
        return;
      }
      lifecycle.update(output);
      lifecycle.effect(output);
      lifecycle.notify(output);
      lifecycle.after(output);
      return output;
    },
  });
  return lifecycle;
}
```

Here is the impl of factory machine, the main star of this lib:

```ts
export function createMachine<
  SF extends KeyedStateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends FactoryMachineEvent<FC> = FactoryMachineEvent<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryKeyedState<FC["states"]>
): FactoryMachine<FC> {
  const initialState = typeof init === "string" ? states[init]({}) : init;

  let lastChange: E = new FactoryMachineEventImpl<E>(
    "__initialize" as E["type"],
    initialState as E["from"],
    initialState as E["to"],
    []
  ) as E;

  const machine = withLifecycle(
    {
      states,
      transitions,
      getChange: () => lastChange,
      getState: () => lastChange.to,
      send(type, ...params) {
        const resolved = machine.resolveExit({
          type,
          params,
          from: lastChange.to,
        } as ResolveEvent<E>);
        if (resolved) {
          machine.transition(resolved);
        }
      },
      resolveExit: (ev) => {
        const to = resolveNextState<FC>(transitions, states, ev);
        return to
          ? new FactoryMachineEventImpl(ev.type, ev.from, to, ev.params)
          : undefined;
      },
    } as Partial<FactoryMachine<FC>>,
    (ev: E) => {
      lastChange = ev;
    }
  ) as FactoryMachine<FC>;

  return machine;
}
```

with this logic 

```ts

/**
 * Resolves the next state for a given event using the provided transitions and states.
 * @param transitions - Transition handlers for each state
 * @param states - State factory functions
 * @param ev - The event to resolve
 * @returns The next state instance or undefined if no transition exists
 * @source This function is useful for determining the next state in a state machine based on
 * the current state, event, and transition handlers. It enables dynamic state resolution and
 * transition logic.
 */
export function resolveNextState<FC extends FactoryMachineContext<any>>(
  transitions: FC["transitions"],
  states: FC["states"],
  ev: ResolveEvent<FactoryMachineEvent<FC>>
) {
  const transition = transitions[ev.from.key]?.[ev.type];
  return resolveExitState(transition, ev, states);
}

/**
 * Resolves the exit state for a given transition and event.
 * @param transition - Transition handler or state key
 * @param ev - The event to resolve
 * @param states - State factory functions
 * @returns The resolved state instance or undefined
 * @source This function is useful for executing transition logic and resolving the resulting state
 * in a state machine. It supports both direct state transitions and transition handlers for flexible
 * state management.
 */
export function resolveExitState<FC extends FactoryMachineContext<any>>(
  transition: FactoryMachineTransition<FC["states"]> | undefined,
  ev: ResolveEvent<FactoryMachineEvent<FC>>,
  states: FC["states"]
) {
  if (!transition) {
    return undefined;
  }

  if (typeof transition === "function") {
    const stateOrFn = transition(...ev.params);
    return typeof stateOrFn === "function" ? (stateOrFn as any)(ev) : stateOrFn;
  }

  return states[transition as keyof typeof states](...ev.params) as any;
}
```

Now I want hierarchical state machines but need a tech design. There are a couple diff ways to do it i think but usually I think about composing machines. But need way to implement the hierarchical state management where outerstates remain the same while inner states change. seems very similar to the nested routing concern. very similar to me. I wonder if figuring out one could help us figure out the other. (I said this in an earlier AI convo in our branch working on a routing machine that could handle nested routes, and I think nested states is similar and I want this so lets try it)

Please write a clear document for me, the solo dev of all this code, with detailed technical design and implementation details for hierarchical state machines. I'm not sure what API makes sense for creation or configuring or composing machines / states etc. Typing is essential also. Need to maintain full typing.

Somewhere in git where we probably can't find now, ages ago I explored this. Had some luck including submachines on state payloads. But wasn't sure how to cascade down / bubble up state changes. Write a robust doc at HIERARCHICAL_MACHINES_DESIGN.md exploring the core options, patterns and implementation details. Not lookign for a book report here. I'm the dev. I want to move. I want to be educated about what matters but not about things that don't matter. Want to cover our bases conceptually and understand the update patterns / lifecycle impact and state change cascade / bubble up / down details.

More background material below:

---

Earlier reply from GPT-5

Your proposed shape is solid: a nested object with a “routes” field. It’s elegant, traversable, and (as a literal) prevents cycles by construction.

Recommended shape
Single nested tree with optional shorthand for leaves.
No cycles because children are embedded by value, not by reference.
ts
// types
export type RouteTree = {
  [name: string]: { path: string; routes?: RouteTree } | string; // string = leaf shorthand
};

// example config
export const routes: RouteTree = {
  Home: "/",
  About: "/about",
  Products: {
    path: "/products",
    routes: {
      Product: {
        path: "/products/:id",
        routes: {
          ProductOverview: "/products/:id/overview",
          ProductSpecs: "/products/:id/specs",
          ProductReviews: "/products/:id/reviews",
        },
      },
    },
  },
  User: "/users/:userId",
};
Minimal helpers
Flatten to the path map for 
createRouter
.
Find node, ancestors, descendants for composing view layers (without repetition).
ts
type Flat = Record<string, string>;

function normalize(node: { path: string } | string): { path: string; routes?: RouteTree } {
  return typeof node === "string" ? { path: node } : node;
}

export function flattenPaths(tree: RouteTree): Flat {
  const out: Flat = {};
  const walk = (t: RouteTree) => {
    for (const [name, val] of Object.entries(t)) {
      const n = normalize(val);
      out[name] = n.path;
      if (n.routes) walk(n.routes);
    }
  };
  walk(tree);
  return out;
}

export function findNode(tree: RouteTree, name: string): { node: { path: string; routes?: RouteTree } | null; ancestors: string[] } {
  const path: string[] = [];
  const dfs = (t: RouteTree): { node: any; found: boolean } => {
    for (const [nm, val] of Object.entries(t)) {
      const n = normalize(val);
      path.push(nm);
      if (nm === name) return { node: n, found: true };
      if (n.routes) {
        const r = dfs(n.routes);
        if (r.found) return { node: r.node, found: true };
      }
      path.pop();
    }
    return { node: null, found: false };
  };
  const { node, found } = dfs(tree);
  return { node: found ? node : null, ancestors: found ? path.slice(0, -1) : [] };
}

export function descendantsOf(tree: RouteTree, name: string): string[] {
  const target = findNode(tree, name).node;
  if (!target) return [];
  const out: string[] = [];
  const walk = (t?: RouteTree) => {
    if (!t) return;
    for (const [nm, val] of Object.entries(t)) {
      out.push(nm);
      const n = normalize(val);
      walk(n.routes);
    }
  };
  walk(target.routes);
  return out;
}
Using with your current setup
In 
appRouter.ts
, pass flattenPaths(routes) to 
createRouter
.
In 
RouterApp.tsx
, build layer view maps programmatically:
Site layer: base site views + aliasDescendants(tree, ["Products"], Products)
Product layer: base product view + aliasDescendants(tree, ["Product"], Product)
Tabs layer: tab content views
Helper to alias without repetition:

ts
export function aliasDescendants(tree: RouteTree, roots: string[], comp: React.ComponentType<any>) {
  const map: Record<string, React.ComponentType<any>> = {};
  for (const r of roots) for (const d of descendantsOf(tree, r)) map[d] = comp;
  return map;
}
Why this is elegant
Single config source: name, path, and children together.
Deterministic and data-only.
View layers composed from the tree, not by hand-duplicating names.
No router tree-walking; 
Routes
 stays tiny and viewers render children.
If you want, I can implement this in 
docs/src/code/examples/router/appRouter.ts
 and add a small routeTree.ts with these helpers.

...

You’re thinking about the right analogy: nested routing layers ≈ hierarchical state machines (HSMs). The core need is: outer (“shell”) state persists while inner (“tab”) state changes, with clean scoping of events and transitions.

Here are concise, workable patterns you can use in matchina without making the router/viewers complex.

Models that work
Parent-with-submachine map (route-scoped)
Parent machine holds a map of child machines keyed by “where you are” (e.g., route leaf or logical context).
Entering a scope ensures a child exists; leaving can keep or dispose per your retention policy.
Events flow: child.handle(e) first; if unhandled, parent.handle(e) (bubble).
Good for your nested SlideViewer layers: each layer’s machine persists while deeper layers change.
Orthogonal regions (parallel submachines)
Parent holds multiple independent submachines (layout, data, animation), all alive concurrently.
Events can be broadcast to all or routed to one region.
Good when multiple concerns progress independently (e.g., slide transition controller vs. data fetch).
State-indexed child machine
Parent state enum determines which child machine is active.
Transitioning parent swaps the active child; persistence optional by caching snapshots per parent state.
Good when parent mode strictly implies a different child machine.
Stacked submachines (stack/chain)
Maintain a stack (or chain) representing hierarchical scopes (like route chain).
Each frame has its machine; only top handles most events; some bubble down/up.
Perfect mirror of nested routing: chain = [Site, Product, Tab].
Event and transition discipline
Deterministic propagation
Local-first, then bubble to parent(s). No surprises.
Example order: top child → its parent → … → root.
Scoped events
Namespaced types or explicit “target” metadata for routing events to a region/scope.
Retain vs dispose policy
Keep child snapshot when leaving scope (like keep=3 in viewers) or tear down to free memory.
Pure transitions
Use Immer for transition purity. You already have direct and curried patterns; apply them per machine.
Minimal store shape (fits matchina)
Machine interface
init(): snapshot
handle(snapshot, event): { next, handled }
optional serialize/rehydrate if you need persistence.
Parent machine snapshot
ownState
children: Map<scopeKey, { machineId, snapshot, keepMeta }>
Dispatcher
Given current “chain” (e.g., from router: site → product → tab), ensure each level’s submachine exists.
Dispatch event to deepest scope first; if unhandled, bubble.
Hooking to routing layers
Chain as scopes: use 
match
’s parent pointers or derived chain from the resolved route.
Layered viewers: each layer can subscribe to its scope machine slice, rendering transitions locally while outer layers persist.
Practical recipe for you
1) Define scopes
For routing, scopes = route names in the to-chain (e.g., Products → Product → ProductOverview).
For non-routing concerns, define explicit scope keys (e.g., Layout, Data, Animation).
2) Keep a submachine registry
Keyed by scope name. Provide factory per scope.
3) Dispatch rules
On route change: ensure machines exist for each scope in chain; prune extras beyond keep N.
On event: send to deepest scope; bubble deterministically.
4) Immer transitions
Direct for simple updates, curried when you need the full change context.
Your earlier Immer patterns fit perfectly here.
Why this maps to your viewers/router
Outer SlideViewer = parent scope (kept).
Inner SlideViewer = child scope (changes).
Router remains dumb, only provides the chain and change events.
Viewers subscribe to their scope machine state and render transitions.
If you want next steps
I can add a tiny hierarchical dispatcher to matchina’s store:
API: register(scopeName, machineFactory), dispatch(event), onRouteChange(chain, keepPolicy).
Deterministic bubble.
Or, simpler: a demo in docs/ that shows a SiteMachine → ProductMachine → TabMachine, driven purely by route chain, using your Immer transition helpers.
Summary: model HSMs as nested scopes with local-first event handling and optional retention. It aligns 1:1 with your nested Routes/SlideViewer architecture and keeps the router/viewers minimal while giving you strong hierarchical state.


Summary: model HSMs as nested scopes with local-first event handling and optional retention. It aligns 1:1 with your nested Routes/SlideViewer architecture and keeps the router/viewers minimal while giving you strong hierarchical state

---

think of a better example for state machine that is not routing. 
consider this example from sketch.systems

Powered*
  power failed -> Unpowered

  Green*
    tick -> Yellow

  Yellow
    tick -> Red

  Red
    tick -> Green

Unpowered
  power restored -> Powered

  Red On*
    tick -> Red Off

  Red Off
    tick -> Red On


