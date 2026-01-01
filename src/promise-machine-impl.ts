import { defineStates } from "./define-states";
import { createMachine } from "./factory-machine";
import {
  PromiseCallback,
  PromiseMachine,
  PromiseStates,
} from "./promise-types";

/**
 * State definitions for the promise state machine.
 *
 * States:
 * - Idle: Initial state, no promise running.
 * - Pending: Promise is executing, stores the promise and its parameters.
 * - Rejected: Promise was rejected, stores the error.
 * - Resolved: Promise was resolved, stores the result data.
 * @source
 */
export const PROMISE_STATES: PromiseStates<any> = defineStates({
  Idle: undefined,
  Pending: (promise: Promise<any>, params: any[]) => ({ promise, params }),
  Rejected: (error: any) => error,
  Resolved: (data: any) => data,
});

/**
 * Transition definitions for the promise state machine.
 *
 * Transitions:
 * - Idle: executing → Pending
 * - Pending: resolve → Resolved, reject → Rejected
 * @source
 */
export const PROMISE_TRANSITIONS = {
  Idle: { executing: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
  Resolved: {}, // Terminal state - no outgoing transitions
  Rejected: {}, // Terminal state - no outgoing transitions
} as const;

/**
 * Creates a state machine for managing promise lifecycles.
 * Handles Idle, Pending, Resolved, and Rejected states, and transitions for executing, resolving, and rejecting promises.
 *
 * Usage:
 * ```ts
 * const machine = createPromiseMachine((...args) => fetch(...args));
 * machine.execute(url).then(...).catch(...);
 * machine.getState().match({
 *   Idle: () => console.log("No promise running"),
 *   Pending: ({ promise }) => console.log("Promise is executing", promise),
 *   Resolved: (data) => console.log("Promise resolved with data", data),
 *   Rejected: (error) => console.error("Promise rejected with error", error),
 * });
 * ```
 * @template F - The promise factory function type.
 * @param makePromise - Optional factory function to create a promise. If omitted, `execute` will throw.
 * @returns A PromiseMachine instance with an `execute` method to run the promise and manage its state.
 *
 */
export function createPromiseMachine<
  F extends PromiseCallback = PromiseCallback,
>(makePromise?: F): PromiseMachine<F> {
  const states = PROMISE_STATES as unknown as PromiseStates<F>;
  const machine = createMachine(states, PROMISE_TRANSITIONS, "Idle");

  let currentPromise: Promise<any> | undefined;

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
      promise
        .then((result) => {
          if (currentPromise === promise) {
            machine.send("resolve", result);
            resolve(result);
          }
        })
        .catch((error) => {
          if (currentPromise === promise) {
            machine.send("reject", error);
            reject(error);
          }
        });
    });
  }

  return Object.assign(machine, { execute });
}
