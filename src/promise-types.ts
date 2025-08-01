import { StateMatchboxFactory } from "./state-types";
import { FactoryMachine, FactoryMachineEvent } from "./factory-machine-types";

export type PromiseTransitions = {
  readonly Idle: {
    readonly executing: "Pending";
  };
  readonly Pending: {
    readonly resolve: "Resolved";
    readonly reject: "Rejected";
  };
};

export type PromiseStateCreators<F extends PromiseCallback, E> = {
  Idle: undefined;
  Pending: (
    promise: Promise<Awaited<ReturnType<F>>>,
    params: Parameters<F>
  ) => { promise: Promise<Awaited<ReturnType<F>>>; params: Parameters<F> };
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
};

export type PromiseStates<F extends PromiseCallback, E = Error> = StateMatchboxFactory<
  PromiseStateCreators<F, E>
>;

export type PromiseCallback = (...args: any[]) => Promise<any>;

export type PromiseMachine<F extends PromiseCallback> = FactoryMachine<{
  states: PromiseStates<F>;
  transitions: PromiseTransitions;
}> & {
  execute: (...params: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;
};
export type PromiseMachineEvent<F extends PromiseCallback> =
  FactoryMachineEvent<PromiseMachine<F>>;
