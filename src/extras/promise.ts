import { defineMachine } from "../machine";
import { defineStates } from "../states";
import { onUpdate } from "./on-update";

export function createPromiseMachine<T, A, E extends Error = Error>(
  makePromise?: (...args: A[]) => Promise<T>,
) {
  const states = defineStates({
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
  const initialState = states.Idle();
  const machine = Machine.create(initialState);
  if (makePromise) {
    const _makePromise = makePromise;
    function execute(params: any[]) {
      const promise = _makePromise(...params);
      promiseMachine.promise = promise;
      promiseMachine.done = promise
        .then(machine.event.resolve)
        .catch(machine.event.reject);
    }
    onUpdate(machine, (commit, updater) => {
      commit((before) => {
        const after = updater(before);
        if (after.type === "execute") {
          execute(after.params);
        }
        return after;
      });
    });
  }
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<T>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}
