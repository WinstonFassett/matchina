import { defineMachine, defineStates, onLifecycle } from "../src"

const states = defineStates({
  Idle: undefined, 
  Done: undefined
})
const Machine = defineMachine(
  states, 
  {
    Idle: {
      go: 'Done'
    },
    Done: {}
  }
)

const createMachineWithContext = () => {
  const context = {
    count: 1,
    inc: () => context.count++,
  }  
  const machine = Machine.create(states.Idle())
  onLifecycle(machine, {
    Idle: {
      on: {
        go: {
          guard: () => context.count === 1,
          after: () => { context.inc() }
        }
      }
    }
  })
  return Object.assign(machine, { context })
}