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
const change = machine.getChange()
const type = change.type
change.from.key
change.to.key
machine.send('execute')
// machine.send('')
