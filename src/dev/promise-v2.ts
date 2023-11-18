
import { States, defineStates } from "../states";
import { createStateChangeMachine } from "./machine-v2";

// export type PromiseStates<
//   T = any,
//   A extends any[] = unknown[],
//   E extends Error = Error,
// > = States<{
//   Idle: undefined;
//   Pending: (...params: A) => A;
//   Rejected: (error: E) => E;
//   Resolved: (data: T) => T;
// }>;

type PromiseStates<T, A extends any[], E extends Error> = States<{
  Idle: undefined;
  Pending: (...params: A[]) => A;
  Rejected: (error: E) => E;
  Resolved: (data: T) => T;
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




export function createThing<
  T,
  P extends any[],
>(makePromise: (...params: P) => Promise<T>) {
  function testFunc(...params: P): T {
    // Your logic here
    return {} as T
  }

  const result = testFunc(...([undefined] as P));
  return result;
}




export function createPromiseMachine<
  T,
  P extends any[],
  E extends Error = Error,
>(makePromise?: (...args: P) => Promise<T>) {
  const states = definePromiseStates<T, P, E>();
  
  // const states = defineStates({
  //   Idle: undefined,
  //   Pending: (...params: P[]) => params,
  //   Rejected: (error: E) => error,
  //   Resolved: (data: any) => data,
  // });

  const machine = createStateChangeMachine(states, promiseTransitions, {
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
export type PromiseMachine = ReturnType<typeof createPromiseMachine>;
export type PromiseMachineEvent = ReturnType<PromiseMachine["getChange"]>;
// export type PromiseContextStates = PromiseMachine["context"]["states"];
// export type PromiseTransitions = PromiseMachine["context"]["transitions"];
// export type PromiseContextStateKey = keyof PromiseContextStates;
// export type PromiseStateKey = keyof PromiseStates;

function definePromiseStates<T, A extends any[], E extends Error = Error>() {
  return promiseStates as unknown as PromiseStates<T, A, E>;
}
