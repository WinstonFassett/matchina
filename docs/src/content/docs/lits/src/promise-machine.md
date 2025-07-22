---
title: "promise-machine"
description: "Add description here"
---


```ts
import {
  FactoryMachine,
  FactoryMachineEvent,
  createMachine,
} from "./factory-machine";
import { States, defineStates } from "./define-states";

export type PromiseStateCreators<F extends PromiseCallback, E> = {
  Idle: undefined;
  Pending: (
    promise: Promise<Awaited<ReturnType<F>>>,
    params: Parameters<F>,
  ) => { promise: Promise<Awaited<ReturnType<F>>>; params: Parameters<F> };
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
};

export type PromiseStates<F extends PromiseCallback, E = Error> = States<
  PromiseStateCreators<F, E>
>;

export const PromiseStates: PromiseStates<any> = defineStates({
  Idle: undefined,
  Pending: (promise: Promise<any>, params: any[]) => ({ promise, params }),
  Rejected: (error: any) => error,
  Resolved: (data: any) => data,
});

export type PromiseTransitions = {
  readonly Idle: {
    readonly executing: "Pending";
  };
  readonly Pending: {
    readonly resolve: "Resolved";
    readonly reject: "Rejected";
  };
};

export const PromiseTransitions: PromiseTransitions = {
  Idle: { executing: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
} as const;

export type PromiseCallback = (...args: any[]) => Promise<any>;

export function createPromiseMachine<
  F extends PromiseCallback = PromiseCallback,
>(
  makePromise?: F,
): PromiseMachine<F> & {
  execute: (...params: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;
} {
  const states = PromiseStates as unknown as PromiseStates<F>;
  const machine = createMachine(states, PromiseTransitions, "Idle");

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

export type PromiseMachine<F extends PromiseCallback> = FactoryMachine<{
  states: PromiseStates<F>;
  transitions: PromiseTransitions;
}>;
export type PromiseMachineEvent<F extends PromiseCallback> =
  FactoryMachineEvent<PromiseMachine<F>>;
// ReturnType<
//   typeof createPromiseMachine<F>
// >;
// export type PromiseMachineEvent<F extends PromiseCallback> = ReturnType<
//   PromiseMachine<F>["getChange"]
// >;
// export type PromiseContextStates<F extends PromiseCallback> =
//   PromiseMachine<F>["states"];
// export type PromiseTransitions = PromiseMachine<any>["transitions"];
// export type PromiseContextStateKey = keyof PromiseContextStates<any>;
// export type PromiseStateKey = keyof PromiseStates<any>;
```
