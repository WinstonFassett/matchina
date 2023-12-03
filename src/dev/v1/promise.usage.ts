// @noErrors
import { TransitionConfig } from "../../../dist";
import { delay } from "./extras/delay";
import { createPromiseMachine } from "./extras/promise";
import { withEvents } from "./extras/with-events";
import { makeZen } from "./extras/zen";
import { isChangeTypeToFrom, isKeyedChangeEvent } from "../../typeguards";
// ---cut---
async function promiseUsage () {
  const machine = withEvents(createPromiseMachine(async (x: number) => {
    console.log('sleeping for', x)
    await delay(x)
    return `slept for ${x}ms`
  }));
  
  const it = machine.getState().match({
    Rejected: () => ({ kablamo: false }),
    _: () => ({ kablamo: true }),
  });
  console.log(it)
  
  const checkState = () => console.log(machine.getState().match({  
    Resolved: res => `DONE: ${res}`,
    Rejected: err => `Error! ${err}`,
    _: () => `Not yet: ${machine.getState().key}`
  }));
  // TODO: add this to promise
  const reset = () => {
    console.log('resetting')
    machine.update(c => ({ ...c, to: machine.context.states.Idle() }))
  }
  checkState()
  machine.event.execute(1000);
  checkState()
  const pendingPromise = machine.promise
  if (pendingPromise !== machine.promise) {
    console.log('Got valid result BUT promise changed!' )    
  }
  reset()
  machine.event.execute(1)
  const donePromise = machine.done
  const beforeDoneState = machine.getState()
  checkState()
  console.log('rejecting')
  machine.event.reject(new Error("error"));
  checkState()
  
  await donePromise
  const doneState = machine.getState()
  if (machine.done === donePromise && doneState === beforeDoneState) {
    console.log('changed', doneState.data)
  } else {
    console.log(`state changed from ${beforeDoneState.key} to ${doneState.key}`)
  }
  

  reset()
  // machine.send2('execute', 1000)
  machine.send<'execute'>('execute', 1)
  machine.send('execute', 1000)
  machine.send('reject', new Error('error'))
  // machine.debugParams<any, 'Pending'>('resolve')('ok')
  // machine.debugParams<'execute', 'Idle'>('execute')(123)
  await delay(2)
  checkState()
  reset()
  await delay(1)
  checkState()
  await delay(1)
  checkState()

  

  const fetchMachine = withEvents(createPromiseMachine((id: number) => 
    fetch(`.data/${id}`)
      .then((response) => response.json())
  ))

  const logState = () => fetchMachine.getState().match({
    Resolved: (data) => console.log(data),
    Rejected: (error) => console.log(error.message),
    _: () => console.log('not yet'),
  })

  logState() // not yet
  fetchMachine.event.execute(123)
  logState() // not yet
  await fetchMachine.done
  logState() // result or error

  const zenFetch = makeZen(fetchMachine)
  zenFetch.execute(123)  
  const { state } = zenFetch

  const change = machine.getChange()
  
  if (isKeyedChangeEvent(change, {
    to: 'Idle',
    from: 'Pending',
    type: 'execute',
  })) {
    change.from.key = 'Pending'
    change.type = 'execute'
    change.to.key = 'Idle'
  }

  if (isChangeTypeToFrom(change, ['execute', 'reject'], 'Idle', 'Pending')) {
    change.from.key = 'Pending'
    change.type = 'execute'
    change.to.key = 'Idle'
  }
    
  type PromiseTransitionStateKeys = keyof typeof fetchMachine.context.transitions
  type TransitionEventKeys<
    Transitions extends TransitionConfig<any>,
    StateKey extends keyof Transitions,
  > = keyof Transitions[StateKey]
  type PromiseTransitionEventKeys<T extends PromiseTransitionStateKeys> = TransitionEventKeys<typeof fetchMachine.context.transitions, T>
  type TransitionStateKeys<Transitions extends TransitionConfig<any>> = 
    keyof Transitions
  // type TransitionStateEventKeys<
  //   Transitions extends TransitionConfig<any>, 
  //   StateKey extends keyof Transitions
  // > =
  //  keyof Transitions[keyof Transitions]
  
  ;
    type Idle = PromiseTransitionStateKeys extends infer S ? S extends 'Idle' ? S : never : never
    type Pending = PromiseTransitionStateKeys extends infer S ? S extends 'Pending' ? S : never : never
    type ExecuteEvents = PromiseTransitionEventKeys<Idle>
    type ExecuteEventKeys2 = TransitionEventKeys<typeof fetchMachine.context.transitions, 'Idle'>
    type PendingEventKeys2 = TransitionEventKeys<typeof fetchMachine.context.transitions, 'Pending'>
    type StateKeys2 = TransitionStateKeys<typeof fetchMachine.context.transitions>
    type PendingEvents = PromiseTransitionEventKeys<Pending>
  // type Pending = TransitionStateKeys extends 'Pending' ? 'Pending' : never;
  
  /*
Property 'execute' does not exist on type '{ execute: (x: number) => Matchbox<{ Idle: undefined; Pending: (x: number) => [x: number]; Rejected: (error: Error) => Error; Resolved: (data: string) => string; }, "key", "Pending", [x: ...]>; } | { ...; } | {} | {}'.ts(2339)
Property 'reject' does not exist on type '{ execute: (x: number) => Matchbox<{ Idle: undefined; Pending: (x: number) => [x: number]; Rejected: (error: Error) => Error; Resolved: (data: string) => string; }, "key", "Pending", [x: ...]>; } | { ...; } | {} | {}'.ts(2339)
Property 'resolve' does not exist on type '{ execute: (x: number) => Matchbox<{ Idle: undefined; Pending: (x: number) => [x: number]; Rejected: (error: Error) => Error; Resolved: (data: string) => string; }, "key", "Pending", [x: ...]>; } | { ...; } | {} | {}'.ts(2339)  
  */
}

await promiseUsage()
