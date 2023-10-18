import { defineMachine } from "./machine";
import { onUpdate } from "./on-update";
import { createStates } from "./states";

export function createPromiseMachine<T, A, E extends Error = Error>(
  makePromise?: (...args: A[]) => Promise<T>,
  ) {
  const states = createStates({
    Idle: undefined,
    Pending: (...params: A[]) => params,
    Rejected: (error: E) => error,
    Resolved: (data: T) => data,
  });
  const Machine = defineMachine(states, {
    Idle: { execute: "Pending" },
    Pending: {
      resolve: "Resolved",
      reject: "Rejected",
    },
    Resolved: { execute: "Pending" },
    Rejected: { execute: "Pending" },
  });
  const initialState = Machine.states.Idle()
  const machine = Machine.create(initialState);
  if (makePromise) {
    const _makePromise = makePromise
    function execute(params: any[]) {
      const promise = _makePromise(...params);
      promiseMachine.promise = promise;
      promiseMachine.done = promise
        .then(machine.events.resolve)
        .catch(machine.events.reject);
    }
    onUpdate(machine, (commit, updater) => {
      const after = updater(machine.getLast())
      after.to.match({ 
        Pending: execute, 
        _(){}
      })
      commit(() => after)      
    })
  }
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<T>,
    done: undefined as undefined | Promise<void>
  });
  return promiseMachine


}
