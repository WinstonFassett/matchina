import { defineMachine, defineStates } from "../src"


const states = defineStates({
  FOO: () => ({}),
  BAR: () => ({}),
})

const runMachine = defineMachine(
  states,
  {
    FOO: {
      switch: () => () => states.BAR(),
    },
    BAR: {
      switch: () => () => states.FOO(),
    },
  }
)

const machine = runMachine.create(states.FOO())

machine.event.switch()

const currentState = machine.getState()

// No subscription (yet)

// const dispose = machine.subscribe((state, event, prevState) => {
//   // Any change
// })

// const dispose = machine.subscribe("FOO", (state) => {
//   // When entering state
//   return () => {
//     // When exiting state
//   }
// })

// const dispose = machine.subscribe(["FOO", "BAR"], (state) => {
//   // When first entering either state
//   return () => {
//     // When exiting to other state
//   }
// })

// const dispose = machine.subscribe(
//   "FOO",
//   "switch",
//   (state, eventParams) => {
//     // When entering state by event
//   }
// )

// const dispose = machine.subscribe(
//   ["FOO", "BAR"],
//   "switch",
//   (state, eventParams) => {
//     // When entering either state by event
//   }
// )

// const dispose = machine.subscribe(
//   "FOO",
//   "switch",
//   "BAR",
//   (state, eventParams, prevState) => {
//     // When entering state by event from state
//   }
// )

// const dispose = machine.subscribe(
//   ["FOO", "BAR"],
//   "switch",
//   "BAZ"
//   (state, eventParams, prevState) => {
//     // When entering either state by event from state
//   }
// )