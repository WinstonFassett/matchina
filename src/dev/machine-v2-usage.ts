import { defineStates } from '../states'
import { CreateStateChangeMachineProps, createMachineWithHooks, createStateChangeMachine } from './machine-v2'

const states = defineStates({
  Idle: {},
  Pending: {},
  Resolved: {},
  Rejected: {} 
})


const machine = createStateChangeMachine(
  states, 
  {
    Idle: {
      execute: 'Pending'
    },
    Pending: {
      resolve: 'Resolved',
      reject: 'Rejected'
    },
    Resolved: {},
    Rejected: {}
  },
  {}
)

// machine.send('')
