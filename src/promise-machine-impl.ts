import { defineStates } from "./define-states";
import { createMachine } from "./factory-machine";
import { PromiseCallback, PromiseMachine, PromiseStates } from "./promise-types";

export const PROMISE_STATES: PromiseStates<any> = defineStates({
  Idle: undefined,
  Pending: (promise: Promise<any>, params: any[]) => ({ promise, params }),
  Rejected: (error: any) => error,
  Resolved: (data: any) => data,
});
export const PROMISE_TRANSITIONS = {
  Idle: { executing: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
} as const;export function createPromiseMachine<
  F extends PromiseCallback = PromiseCallback
>(
  makePromise?: F
): PromiseMachine<F> & {
  execute: (...params: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;
} {
  const states = PROMISE_STATES as unknown as PromiseStates<F>;
  const machine = createMachine(states, PROMISE_TRANSITIONS, "Idle");

  let currentPromise: Promise<any> | undefined;
  let resolveCurrent: ((value: any) => void) | undefined;
  let rejectCurrent: ((reason: any) => void) | undefined;

  function execute(...params: Parameters<F>): Promise<Awaited<ReturnType<F>>> {
    if (!makePromise) {
      throw new Error("No promise factory provided");
    }
    if (machine.getState().key !== "Idle") {
      throw new Error("Can only execute from Idle state");
    }
    const promise = makePromise(...params);
    currentPromise = promise;
    machine.send("executing", promise, params);
    return new Promise((resolve, reject) => {
      resolveCurrent = resolve;
      rejectCurrent = reject;
      promise
        .then((result) => {
          if (currentPromise === promise) {
            machine.send("resolve", result);
          }
        })
        .catch((error) => {
          if (currentPromise === promise) {
            machine.send("reject", error);
          }
        });
    });
  }

  machine.before = (ev) => {
    if (ev.type === "executing") {
      // Store the promise and params on the Pending state
      // Already handled by execute method
    }
    if (ev.from.key === "Pending") {
      currentPromise = undefined;
      resolveCurrent = undefined;
      rejectCurrent = undefined;
    }
    return ev;
  };

  machine.after = (ev) => {
    if (ev.type === "resolve" && resolveCurrent) {
      resolveCurrent(ev.params);
      resolveCurrent = undefined;
      rejectCurrent = undefined;
    }
    if (ev.type === "reject" && rejectCurrent) {
      rejectCurrent(ev.params);
      resolveCurrent = undefined;
      rejectCurrent = undefined;
    }
    return ev;
  };

  return Object.assign(machine, { execute });
}

