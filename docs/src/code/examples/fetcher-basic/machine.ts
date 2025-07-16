import type { FactoryMachine, FactoryMachineEvent, States } from "matchina";
import { defineStates, effect, facade, setup } from "matchina";

// State type definitions
export type PromiseStateCreators<F extends PromiseCallback, E> = {
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
};

export type PromiseStates<F extends PromiseCallback, E = Error> = States<
  PromiseStateCreators<F, E>
>;

export const PromiseStates: PromiseStates<any> = defineStates({
  Idle: undefined,
  Pending: (...params: any[]) => params,
  Rejected: (error: any) => error,
  Resolved: (data: any) => data,
});

// Transition definitions
export type PromiseTransitions = {
  readonly Idle: {
    readonly execute: "Pending";
  };
  readonly Pending: {
    readonly resolve: "Resolved";
    readonly reject: "Rejected";
  };
};

export const PromiseTransitions: PromiseTransitions = {
  Idle: { execute: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
} as const;

export type PromiseCallback = (...args: any[]) => Promise<any>;

export type PromiseMachine<F extends PromiseCallback> = FactoryMachine<{
  states: PromiseStates<F>;
  transitions: PromiseTransitions;
}>;

export type PromiseMachineEvent<F extends PromiseCallback> =
  FactoryMachineEvent<PromiseMachine<F>>;

// Core promise machine creator
export function createPromiseMachine<
  F extends PromiseCallback = PromiseCallback,
>(makePromise?: F) {
  const states = PromiseStates as unknown as PromiseStates<F>;
  const impl = Object.assign(facade(states, PromiseTransitions, "Idle"), {
    promise: undefined as undefined | ReturnType<F>,
    done: undefined as undefined | Promise<unknown>,
  });

  if (makePromise) {
    setup(impl.machine)(
      effect((change) => {
        if (change.type !== "execute") return;
        const promise = makePromise(...change.params) as ReturnType<F>;
        impl.promise = promise;
        impl.done = impl.promise
          .then(impl.resolve)
          .catch(impl.reject)
          .finally(() => {
            delete impl.promise;
            delete impl.done;
          });
      }),
    );
  }
  return impl;
}

// Example function for demonstration
export const promiseDelayedSum = (a: number, b: number, ms = 1000) =>
  new Promise<number>((resolve, reject) => 
    setTimeout(() => {
      if (Math.random() > 0.8) {
        reject(new Error("Random failure"));
      } else {
        resolve(a + b);
      }
    }, ms)
  );

// Enhanced states and transitions for more complex fetchers
export const enhancedPromiseStates = {
  ...PromiseStates,
  ...defineStates({
    Expired: {},
    Aborted: (reason: unknown) => reason,
    Retrying: {},
    Redoing: {},
    Rejected: (tries: number) => ({ tries }),
  }),
};

export const enhancedPromiseTransitions = {
  ...PromiseTransitions,
  Pending: {
    ...PromiseTransitions.Pending,
    abort: "Aborted",
    redo: "Redoing",
    expire: "Expired",
  },
  Aborted: {
    retry: "Retrying",
  },
  Expired: {
    retry: "Retrying",
  },
  Retrying: { "": "Pending" },
  Redoing: { "": "Pending" },
} as const;

export const fetchStates = {
  ...enhancedPromiseStates,
  ...defineStates({
    Pending: (url: string, options = {}) => ({ url, options }),
  }),
};
