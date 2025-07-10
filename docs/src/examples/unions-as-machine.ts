import { SpecRecord, MemberOf, matchboxFactory } from "matchina";
// ---cut---
const states = matchboxFactory(
  {
    Idle: () => ({}),
    Done: (x: number) => ({ result: x }),
  },
  "key",
);
type State = ReturnType<typeof states[keyof typeof states]>;

const events = matchboxFactory(
  {
    execute: (x: number) => x,
  },
  "type",
);
type Event = ReturnType<typeof events[keyof typeof events]>;

const transition = (state: State, event: Event) =>
  state.match({
    Idle: () =>
      event.match({
        execute: (x) => states.Done(x),
      }),
    Done: () => state,
  });

function createMachine(initialState: State) {
  let currentState = initialState;
  return {
    getState: () => currentState,
    send(event: Event) {
      currentState = transition(currentState, event);
    },
  };
}

// Usage
const machine = createMachine(states.Idle());
machine.send(events.execute(123));
console.log(machine.getState().key);

const state = machine.getState();
if (state.is("Done")) {
  state.data.result = 123;
}

// OR

const result = state.as("Done").data.result;
