import { States, defineStates } from "../../states";
import { createFactoryMachine } from "./factory-machine";
import { after, setupMachine } from "./machine-setup";

export type PromiseStates<
  F extends PromiseCallback,
  E = unknown
> = States<{
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<F>) =>  Awaited<F>;
}>;

export const PromiseStates = defineStates({
  Idle: undefined,
  Pending: (...params: any[]) => params,
  Rejected: (error: any) => error,
  Resolved: (data: any) => data,
});

export const PromiseTransitions = {
  Idle: { execute: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
  Resolved: {},
  Rejected: {},
} as const;

type PromiseCallback = (...args: any[]) => Promise<any>

export function createPromiseMachine<
  F extends PromiseCallback
>(makePromise?: (...args: Parameters<F>) => ReturnType<F>) {
  const states = PromiseStates;
  const machine = createFactoryMachine(
    states, PromiseTransitions, states.Idle()
  )
  if (makePromise) {
    setupMachine(machine)(
      after(ev => {
        if (ev.type === "execute") {
          const promise = makePromise(...(ev.params as Parameters<F>));
          promiseMachine.promise = promise;
          promiseMachine.done = promise
            .then((res) => promiseMachine.send("resolve", res))
            .catch((error) => promiseMachine.send("reject", error));
        }
        return true
      })
    )
  }
  machine.transitions
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | ReturnType<F>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}

export type PromiseMachine<F extends PromiseCallback> = ReturnType<typeof createPromiseMachine<F>>;
export type PromiseMachineEvent<F extends PromiseCallback> = ReturnType<PromiseMachine<F>["getChange"]>;
export type PromiseContextStates<F extends PromiseCallback> = PromiseMachine<F>["states"];
export type PromiseTransitions = PromiseMachine<any>["transitions"];
export type PromiseContextStateKey = keyof PromiseContextStates<any>;
export type PromiseStateKey = keyof PromiseStates<any>;
