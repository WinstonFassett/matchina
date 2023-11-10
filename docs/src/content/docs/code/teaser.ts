import { defineStates, createMachine } from "../src";
import { withEvents } from "../src/extras/with-events";
// ---cut---
const machine = createMachine({
  states: defineStates({
    Idle: {},
    Pending: (url: string ) => ({ url }),
    Rejected: (error: Error) => ({ error }),
    Resolved: ({ someResult }: { someResult: string }) => ({ someResult }),
  }),
  initialState: 'Idle',
  transitions: {
    Idle: {
      execute: 'Pending'
    },
    Pending: {
      resolve: 'Resolved',
      reject: 'Rejected'
    },
    Rejected: {},
    Resolved: {}
  },
})
machine.send('execute', 'https://mysite')
const { url } = machine.getState().as('Pending').data
machine.send('reject', new Error('error'))
const { error } = machine.getState().as('Rejected').data

machine.getState().match({
  Idle() { console.log('Idle') },
  Pending({ url }) { console.log('Pending', url) },
  Rejected({ error }) { console.log('Rejected', error)},
  Resolved({ someResult }) { console.log('Resolved', someResult)}
})
