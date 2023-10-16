import { defineMachine } from "./machine";
import { onTransition } from "./on-transition";
import { createStates } from "./states";

export function createPromiseMachine<T extends (...args: any) => Promise<any>>(
  makePromise?: T,
) {
  const states = createStates({
    Idle: undefined,
    Pending: (...params: Parameters<T>) => ({ params }),
    Rejected: (error: Error) => error,
    Resolved: (data: Awaited<ReturnType<T>>) => data,
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
  const machine = Machine.create(Machine.states.Idle())
  if (makePromise) {
    onTransition(machine, (t, ev) => {
      if (ev.event === "execute") {
        makePromise(...(ev.params as any))
          .then(machine.events.resolve)
          .catch(machine.events.reject);
      }
      return ev;
    });
  }
  return machine;
}
