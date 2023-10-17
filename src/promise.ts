import { defineMachine } from "./machine";
import { onTransition } from "./on-transition";
import { createStates } from "./states";

export function createPromiseMachine<T,A, E extends Error = Error>(
  makePromise?: (...args: A[]) => Promise<T>,
) {
  const states = createStates({
    Idle: undefined,
    Pending: (...params: A[]) => ({ params }),
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
  // console.log('creating promise machine')
  const machine = Machine.create(Machine.states.Idle())
  if (makePromise) {
    // console.log('listing for execute')
    onTransition(machine, (t, ev) => {
      // console.log('onTransition', {t, ev})
      if (ev.event === "execute") {
        // console.log('promising')
        makePromise(...(ev.params as any))
          .then(machine.events.resolve)
          .catch(machine.events.reject);
      }
      return t(ev);
    });
  }
  return machine;
}
