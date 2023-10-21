import { UnionDataFactory, UnionFactoryMember, unionize } from "../src/unionize";

export const createStates = <T extends UnionDataFactory>(config: T) => unionize(config, "state");
export const createEvents = <T extends UnionDataFactory>(config: T) => unionize(config, "type");

// Define States
const states = createStates({
  Idle: () => ({}),
  Done: (x: number) => ({ result: x }),
});
type State = UnionFactoryMember<typeof states>

// Define Events
const events = createEvents({
  execute: (x: number) => x,
});
type Event = UnionFactoryMember<typeof events>

// Define state-event transitions
const transition = (state: State, event: Event) => state.match({
  Idle: () => event.match({
    execute: (x) => states.Done(x)
  }),    
  Done: () => state,
});

// Implement state machine
function createMachine (initialState: State) {
  let currentState = initialState
  return {
    getState: () => currentState,
    send (event: Event) {
      currentState = transition(currentState, event)
    }
  }
}

// Usage
const machine = createMachine(states.Idle())
const checkState = () => console.log(machine.getState())
checkState()
machine.send(events.execute(123))
checkState()
machine.send(events.execute(456))
checkState()