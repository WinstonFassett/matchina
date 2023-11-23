import { States, defineStates } from "../../states";
import { createFactoryMachine } from "./factory-machine";
import { guard, setupMachine } from "./machine-setup";
import { createStateMachine } from "./state-machine";



export type PromiseStates<
  F extends PromiseCallback,
  E = unknown
> = States<{
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<F>) =>  Awaited<F>;
}>;

const promiseStates = defineStates({
  Idle: undefined,
  Pending: (...params: any[]) => params,
  Rejected: (error: any) => error,
  Resolved: (data: any) => data,
});

const promiseTransitions = {
  Idle: { execute: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
  Resolved: {},
  Rejected: {},
} as const;


type AnyStatesFactory = Record<string, (...params: unknown[]) => any>;
type PromiseCallback = (...args: any[]) => Promise<any>

export function createPromiseMachine<
  F extends PromiseCallback
>(makePromise?: (...args: Parameters<F>) => ReturnType<F>) {
  const states = definePromiseStates<F>();
  const machine = createFactoryMachine(
    states, promiseTransitions, states.Idle()
  )
  if (makePromise) {
    setupMachine(machine)(
      guard(ev => {
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
    // should this go on context?
    promise: undefined as undefined | ReturnType<F>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}

function definePromiseStates<F extends PromiseCallback, E = unknown>() {
  return promiseStates //as PromiseStates<F,E>;
}


export type PromiseMachine = ReturnType<typeof createPromiseMachine>;
export type PromiseMachineEvent = ReturnType<PromiseMachine["getChange"]>;
export type PromiseContextStates = PromiseMachine["states"];
export type PromiseTransitions = PromiseMachine["transitions"];
export type PromiseContextStateKey = keyof PromiseContextStates;
export type PromiseStateKey = keyof PromiseStates<any>;
