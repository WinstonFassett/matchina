import { StateEventTransitionSenders } from "./factory-event-api";
import {
  StateEventTransitionFuncs,
  createFactoryMachine,
} from "./factory-machine";
import { States, defineStates } from "./states";
import { FlatMemberUnion, FlatMemberUnionToIntersection } from "./utility-types";

export type PromiseStates<F extends PromiseCallback, E = Error> = States<{
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
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

export type PromiseCallback = (...args: any[]) => Promise<any>;

export function createPromiseMachine<F extends PromiseCallback>(
  makePromise?: (...args: Parameters<F>) => ReturnType<F>,
) {
  const states = PromiseStates as unknown as PromiseStates<F>;
  const machine = createFactoryMachine(states, PromiseTransitions, "Idle");
  if (makePromise) {
    machine.before = (ev) => {
      if (ev.type === "execute") {
        const promise = makePromise(...(ev.params as Parameters<F>));
        Object.assign(ev, {
          promise,
          done: promise
            .then((res) => machine.send("resolve", res))
            .catch((error) => machine.send("reject", error)),
        });
      }
      return ev;
    };
  }
  return machine;
}

export type PromiseMachine<F extends PromiseCallback> = ReturnType<
  typeof createPromiseMachine<F>
>;
export type PromiseMachineEvent<F extends PromiseCallback> = ReturnType<
  PromiseMachine<F>["getChange"]
>;
export type PromiseContextStates<F extends PromiseCallback> =
  PromiseMachine<F>["states"];
export type PromiseTransitions = PromiseMachine<any>["transitions"];
export type PromiseContextStateKey = keyof PromiseContextStates<any>;
export type PromiseStateKey = keyof PromiseStates<any>;
type PC = {
  transitions: PromiseTransitions;
  states: PromiseStates<any>;
}
type X = StateEventTransitionFuncs<PC>;

type X2 = FlatMemberUnion<StateEventTransitionSenders<PC>>
type X3 = FlatMemberUnionToIntersection<StateEventTransitionSenders<PC>>

const x2 = {} as X2
const x3 = {} as X3
