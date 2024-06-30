import { FactoryMachine, FactoryMachineEvent, createFactoryMachine } from "./factory-machine";
import { States, defineStates } from "./states";

export type PromiseStateCreators<F extends PromiseCallback, E> = {
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
};

export type PromiseStates<F extends PromiseCallback, E = Error> = States<PromiseStateCreators<F, E>>;

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
}

export const PromiseTransitions: PromiseTransitions = {
  Idle: { execute: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
} as const;

export type PromiseCallback = (...args: any[]) => Promise<any>;

export function createPromiseMachine<F extends PromiseCallback = PromiseCallback>(
  makePromise?: F,
): PromiseMachine<F> {
  const states = PromiseStates as unknown as PromiseStates<F>;
  const machine = createFactoryMachine(states, PromiseTransitions, "Idle");
  if (makePromise) {
    machine.before = (ev) => {
      if (ev.type === "execute") {
        const promise = makePromise(...(ev.params as Parameters<F>));
        const store = Object.assign(machine, {
          promise,
          done: promise
            .then((res) => {
              if (store.promise === promise) {
                machine.send("resolve", res);
              }
            })
            .catch((error) => machine.send("reject", error)),
        });
      }
      if (ev.from.key === 'Pending') {
        const store = machine as any
        store.promise = undefined;
        store.done = undefined;
      }
      return ev;
    };
  }
  return machine;
}

export type PromiseMachine<F extends PromiseCallback> = FactoryMachine<{
  states: PromiseStates<F>;
  transitions: PromiseTransitions;
}>;
export type PromiseMachineEvent<F extends PromiseCallback> = FactoryMachineEvent<PromiseMachine<F>>;
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
