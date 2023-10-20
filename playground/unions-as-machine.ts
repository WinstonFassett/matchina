import { UnionFactoryMember, unionizer } from "../src/unionize";

const createStates = unionizer('state')
const createEvents = unionizer('type')

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