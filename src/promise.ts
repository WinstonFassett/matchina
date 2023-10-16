import { createMachine } from "./machine";
import { onTransition } from "./on-transition";
import { createStates } from "./states";

export function createPromiseMachine<T extends (...args: any) => Promise<any>>(
  makePromise?: T,
) {
  const states = createStates({
    IDLE: undefined,
    PENDING: (...params: Parameters<T>) => ({ params }),
    REJECTED: (error: Error) => error,
    RESOLVED: (data: Awaited<ReturnType<T>>) => data,
  });
  const machine = createMachine(states, {
    IDLE: { execute: "PENDING" },
    PENDING: {
      resolve: "RESOLVED",
      reject: "REJECTED",
    },
    RESOLVED: { execute: "PENDING" },
    REJECTED: { execute: "PENDING" },
  });
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
