import { defineStates, defineMachine } from "../src";
import { withEvents } from "../src/extras/with-events";

type SomeResult = {
  someResult: string
}

type SomeRequest = {
  id: number
}

const states = defineStates({
  Idle: undefined,
  Pending: (req: SomeRequest) => req,
  Rejected: (error: Error) => error,
  Resolved: (data: SomeResult) => data,
})

const Machine = defineMachine(states, {
  Idle: {
    execute: (req: SomeRequest, somethingElse: boolean) => {
      console.log('execute', req.id, somethingElse)

      return states.Pending(req)    
    }
  },
  Pending: {
    resolve: 'Resolved',
    reject: 'Rejected'
  },
  Rejected: {},
  Resolved: {}
})

const initialState = states.Idle()
const sampleRequestState = states.Pending({ id: 123 })
const sampleResponse = states.Resolved({ someResult: 'ok' })
const sampleError = states.Rejected(new Error('nope'))

const machine = withEvents(Machine.create(initialState))
machine.event.execute({ id: 123 }, true)
machine.event.reject(new Error('error'))

