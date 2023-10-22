import { delay } from "../test/delay";
import { createPromiseMachine } from "../src/extras/promise";

async function promiseUsage () {
  const machine = createPromiseMachine(async (x: number) => {
    console.log('sleeping for', x)
    await delay(x)
    return `slept for ${x}ms`
  });
  
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
    machine.update(c => ({ ...c, to: machine.states.Idle() }))
  }
  checkState()
  machine.do.execute(1000);
  checkState()
  const pendingPromise = machine.promise
  if (pendingPromise !== machine.promise) {
    console.log('Got valid result BUT promise changed!' )    
  }
  reset()
  machine.do.execute(1)
  const donePromise = machine.done
  const beforeDoneState = machine.getState()
  checkState()
  console.log('rejecting')
  machine.do.reject(new Error("error"));
  checkState()
  
  await donePromise
  const state = machine.getState()
  if (machine.done === donePromise && state === beforeDoneState) {
    console.log('changed', state.data)
  } else {
    console.log(`state changed from ${beforeDoneState.key} to ${state.key}`)
  }
  

  reset()
  machine.send("execute", [1]);
  await delay(2)
  checkState()
  reset()
  await delay(1)
  checkState()
  await delay(1)
  checkState()
}

await promiseUsage()
