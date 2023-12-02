import { defineMachine } from "../machine";
import { States, defineStates } from "../states";

export type PromiseStates<
  T = any,
  A extends any[] = any[],
  E extends Error = Error,
> = States<{
  Idle: undefined;
  Pending: (...params: A) => A;
  Rejected: (error: E) => E;
  Resolved: (data: T) => T;
}>;

const promiseStates = defineStates({
  Idle: undefined,
  Pending: (...params: any) => params,
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

export function createPromiseMachine<
  T,
  A extends any[],
  E extends Error = Error,
>(makePromise?: (...args: A) => Promise<T>) {
  const states = definePromiseStates<T, A, E>();
  const Machine = defineMachine(states, promiseTransitions);
  const initialState = states.Idle();
  const machine = Machine.create(initialState);
  if (makePromise) {
    const _makePromise = makePromise;
    const origUpdate = machine.update;
    machine.update = (updater) => {
      origUpdate.call(machine, (before) => {
        const after = updater(before);
        if (after.type === "execute") {
          const promise = _makePromise(...(after.params as A));
          promiseMachine.promise = promise;
          promiseMachine.done = promise
            .then((res) => promiseMachine.send("resolve", res))
            .catch((error) => promiseMachine.send("reject", error));
        }
        return after;
      });
    };
  }
  const promiseMachine = Object.assign(machine, {
    // should this go on context?
    promise: undefined as undefined | Promise<T>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}
export type PromiseMachine = ReturnType<typeof createPromiseMachine>;
export type PromiseMachineEvent = ReturnType<PromiseMachine["getChange"]>;
export type PromiseContextStates = PromiseMachine["context"]["states"];
export type PromiseTransitions = PromiseMachine["context"]["transitions"];
export type PromiseContextStateKey = keyof PromiseContextStates;
export type PromiseStateKey = keyof PromiseStates;

function definePromiseStates<T, A extends any[], E extends Error = Error>() {
  return promiseStates as PromiseStates<T, A, E>;
}
