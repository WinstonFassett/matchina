
import { States, defineStates } from "../states";
import { createStateChangeMachine } from "./machine-v2";

export type PromiseStates<T,A,E> = States<{    
  Idle: undefined,
  Pending: <P extends any[]>(...params: P) => P,
  Rejected: (error: any) => E,
  Resolved: (data: any) => T,
}>

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

export type PromiseTransitions = typeof promiseTransitions;

export function createPromiseMachine<
  T,
  P extends any[] = any[],
  E extends Error = Error,
>(makePromise?: (...args: P) => Promise<T>) {
  const states = promiseStates as PromiseStates<T,P,E>
  const machine = createStateChangeMachine(
    states, 
    states.Idle(),
    promiseTransitions, {
    handle: (event) => {
      if (makePromise && event.type === "execute") {
        const promise = makePromise(...(event.params as P));
          promiseMachine.promise = promise;
          promiseMachine.done = promise
            .then((res) => promiseMachine.send("resolve", res))
            .catch((error) => promiseMachine.send("reject", error));
      }
      return event
    }
  });
  const initialState = states.Idle();
  const promiseMachine = Object.assign(machine, {
    // should this go on context?
    promise: undefined as undefined | Promise<T>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}
export type PromiseStateKey = keyof PromiseStates<any,any, any>;

export function definePromiseStates<T, A extends any[], E extends Error = Error>() {
  return promiseStates as PromiseStates<T,A,E>
}
