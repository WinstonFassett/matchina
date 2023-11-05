import { defineMachine } from "../machine";
import { FlatEventKeys, UpdateEnhancer } from "../machine-types";
import { defineStates } from "../states";
import { onUpdate } from "./on-update";

export function createPromiseMachine<
  T,
  A extends any[],
  E extends Error = Error,
>(makePromise?: (...args: A) => Promise<T>, enhancer?: UpdateEnhancer<any>) {
  const states = definePromiseStates<T, A, E>();
  const Machine = defineMachine(states, {
    Idle: { execute: "Pending" },
    Pending: {
      resolve: "Resolved",
      reject: "Rejected",
    },
    Resolved: {},
    Rejected: {},
  });
  const initialState = states.Idle();
  const machine = Machine.create(initialState, enhancer);
  if (makePromise) {
    const _makePromise = makePromise;
    function execute(params: A) {
      const promise = _makePromise(...params);
      promiseMachine.promise = promise;
      promiseMachine.done = promise
        .then((res) => promiseMachine.send("resolve", res))
        .catch((error) => promiseMachine.send("reject", error));
    }
    onUpdate(machine, (commit, updater) => {
      commit((before) => {
        const after = updater(before);
        if (after.type === "execute") {
          execute(after.params as A);
        }
        return after;
      });
    });
  }
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<T>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}
export type PromiseMachine = ReturnType<typeof createPromiseMachine>;
export type PromiseMachineEvent = ReturnType<PromiseMachine["getChange"]>;
export type PromiseStates = PromiseMachine["def"]["states"];
export type PromiseTransitions = PromiseMachine["def"]["transitions"];
export type PromiseStateKey = keyof PromiseStates;
export type PromiseEventKey = FlatEventKeys<PromiseStates, PromiseTransitions>;

function definePromiseStates<T, A extends any[], E extends Error = Error>() {
  return defineStates({
    Idle: undefined,
    Pending: (...params: A) => params,
    Rejected: (error: E) => error,
    Resolved: (data: T) => data,
  });
}
