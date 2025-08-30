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


We have now implemented nestable state machine and flattened state machines. Two different ways to implement hierarchical state machines. 

Flattened machines only have one state factory and transition definitions, namespaced and flattened.

It took a lot of work to get the generics to propagate correctly through all of this. 

