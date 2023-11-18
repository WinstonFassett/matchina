import { defineStates } from '../states'
import { StateEventTransitionSenders, TransitionRecordParameters, TransitionRecordParametersForEvent, createStateChangeMachine } from './machine-v2'

const states = defineStates({
  Idle: {},
  Pending: (s: string) => s,
  Resolved: (d: number) => d,
  Rejected: (error: Error) => ({error})
})
type States = typeof states

const transitions = {
  Idle: {
    execute: 'Pending'
  },
  Pending: {
    resolve: 'Resolved',
    reject: 'Rejected'
  },
  Resolved: {},
  Rejected: {}
} as const

type Transitions = typeof transitions

const machine = createStateChangeMachine(
  states, 
  transitions,
  {}
)
const change = machine.getChange()
const type = change.type
change.from.key
change.to.key

//# region LOCKED


// we use const here but this implements TransitionRecord as you can see
const debug = {
  Pending: {
    reject: (error:Error) => { },
    resolve: function (data: number): void {
      throw new Error('Function not implemented.')
    }
  },
  Idle: {
    execute: function (s: string): void {
      throw new Error('Function not implemented.')
    }
  },
  Resolved: {},
  Rejected: {}
} as const

export type FlatEventKeys<T> = 
  {
    [K in keyof T]: keyof T[K]      
  }[keyof T]
//#endregion

//#region REVIEW / IMPROVE 



//#endregion

//#region LOCKED

type Test = TransitionRecordParameters<typeof debug>
// type Test = unknown[] | ([error: Error] & [data: number]) | [s: string]

type TestError = TransitionRecordParametersForEvent<typeof debug, 'reject'> 
// type TestError = [error: Error]


//#endregion 

machine.send('reject', new Error() )
machine.send('resolve', 123)
// machine.send('execute', '')
// machine.send('')
machine.api.reject(new Error())
machine.senders.Pending.reject(new Error());

type X = TransitionRecordParameters<typeof debug>
type S = StateEventTransitionSenders<Transitions, States>
type SP = TransitionRecordParameters<S>
type ESP = TransitionRecordParametersForEvent<S, 'reject'>
type RSP = TransitionRecordParametersForEvent<S, 'resolve'>
const f = <K>(k: K, ...x: SP) => {
  
}
