import { createFactoryMachine } from "./factory-machine";
import { States, defineStates } from "./states";


export const promiseStates = defineStates({
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
  const states = promiseStates as unknown as PromiseStates<F>;
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

export type PromiseStates<F extends PromiseCallback, E = Error> = States<{
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
}>;

// type PromiseStatesFactory<F extends PromiseCallback> = ReturnType<typeof defineStates<PromiseStateDataCreators<F>>>;

// type PromiseState<
//   F extends PromiseCallback,
//   K extends keyof PromiseStateDataCreators<F> = keyof PromiseStateDataCreators<F>,
// > = AnyFactoryState<PromiseStatesFactory<F>, K>;


// export type PromiseMachine<F extends PromiseCallback> = ReturnType<
//   typeof createPromiseMachine<F>
// >;
// export type PromiseMachineEvent<F extends PromiseCallback> = ReturnType<
//   PromiseMachine<F>["getChange"]
// >;
// export type PromiseContextStates<F extends PromiseCallback> =
//   PromiseMachine<F>["states"];
// export type PromiseTransitions = PromiseMachine<any>["transitions"];
// export type PromiseContextStateKey = keyof PromiseContextStates<any>;
// export type PromiseStateKey = keyof PromiseStateDataCreators<any>;

// type EVE= FactoryEvent<PromiseMachine<any>>
// type PEVE = Simplify<EVE>
