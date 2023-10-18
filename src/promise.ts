import { defineMachine } from "./machine";
import { onTransition } from "./on-transition";
import { createStates } from "./states";

export function createPromiseMachine<T, A, E extends Error = Error>(
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
  const machine = Machine.create(Machine.states.Idle());
  if (makePromise) {
    onTransition(machine, (t, ev, params) => {
      if (ev === "execute") {
        makePromise(...(params as any))
          .then(machine.events.resolve)
          .catch(machine.events.reject);
      }
      return t(ev, params);
    });
  }
  return machine;
}
