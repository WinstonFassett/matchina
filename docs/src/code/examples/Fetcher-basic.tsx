import {
  FactoryMachine,
  FactoryMachineEvent,
  States,
  defineStates,
  effect,
  matchina,
  setup,
  when,
} from "matchina";

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

export function createPromiseMachine<
  F extends PromiseCallback = PromiseCallback,
>(makePromise?: F) {
  const states = PromiseStates as unknown as PromiseStates<F>;
  const impl = Object.assign(matchina(states, PromiseTransitions, "Idle"), {
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

const promiseDelayedSum = (a: number, b: number, ms = 100) =>
  new Promise((resolve, reject) => setTimeout(() => resolve(a + b), ms));

const adder = createPromiseMachine(promiseDelayedSum);

adder.execute(1, 2, 1000);
(await adder.done) ?? Promise.resolve();
console.log("sum", adder.state.as("Resolved").data);

const enhancedPromiseStates = {
  ...PromiseStates,
  ...defineStates({
    Expired: {},
    Aborted: (reason: unknown) => reason,
    Retrying: {},
    Redoing: {},
    Rejected: (tries: number) => ({ tries }),
  }),
};

const enhancedPromiseTransitions = {
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

const fetchStates = {
  ...enhancedPromiseStates,
  ...defineStates({
    Pending: (url: string, options = {}) => ({ url, options }),
  }),
};

const fetcher = Object.assign(
  matchina(fetchStates, enhancedPromiseTransitions, "Idle"),
  {
    // TODO
  },
);
fetcher.execute("https://jsonplaceholder.typicode.com/todos/1");
