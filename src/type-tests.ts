// #region Usage code for testing types. DO NOT REGENERATE THIS. THE FOCUS IS ABOVE THIS LINE

import { createPromiseMachine } from "./extras/promise";
import { MatchboxFactory } from "./matchbox-types";
import {
  StateMachine,
  FlattenedEventTypes,
  Expand,
  TransitionConfig,
  FlatEventers,
  FlatMachineEventers,
  FlatMachineEvents,
  StateTransitionTargets,
  FlatMachineEventTargets,
  FlatMachineEventTargetKeys,
} from "./types";

type PromiseStates<T, A, E extends Error = Error> = MatchboxFactory<
  {
    Idle: undefined;
    Pending: (...params: A[]) => A;
    Rejected: (error: E) => E;
    Resolved: (data: T) => T;
  },
  "key"
>;
type PromiseTransitions<
  T,
  A,
  E extends Error = Error,
  S extends PromiseStates<T, A, E> = PromiseStates<T, A, E>,
> = TransitionConfig<S> & {
  Idle: { execute: "Pending" };
  Pending: {
    resolve: "Resolved";
    reject: "Rejected";
  };
  Resolved: { execute: "Pending" };
  Rejected: { execute: "Pending" };
};
type PromiseMachine<T, A, E extends Error = Error> = StateMachine<
  PromiseStates<T, A, E>,
  PromiseTransitions<T, A, E>
>;
type PromiseSumMachine = PromiseMachine<number, [number, number], Error>;
type PromiseSumEventTypes = FlattenedEventTypes<
  PromiseSumMachine["def"]["states"],
  PromiseSumMachine["def"]["transitions"]
>;
type X2 = Expand<PromiseSumEventTypes>;
type PromiseStateKeys = keyof PromiseStates<any, any>;
type PromiseTransitionKeys = Expand<keyof PromiseTransitions<any, any>>;



type PromiseStatesForStateKeys<T, A, E extends Error = Error> = {
  [StateKey in PromiseStateKeys]: ReturnType<PromiseStates<T, A, E>[StateKey]>;
};

const testStates = {} as PromiseStatesForStateKeys<
  number,
  [number, number],
  Error
>;
testStates.Idle.key = "blarg"; // this must be 'Idle'

// #endregion
const m = createPromiseMachine((a: number, b: number) =>
  Promise.resolve(a + b),
);

type Events = FlatMachineEvents<typeof m>;// data but no typed keys
type Eventers = FlatMachineEventers<typeof m>;
type Targets = FlatMachineEventTargets<typeof m>; // data but not typed keys
type TargetKeys = FlatMachineEventTargetKeys<typeof m>; // event keys

const events = { } as Events
events.execute(1, 2).key = 'Pending'
events.execute(1, 2).data = [1]

const targets = {} as Targets
targets.execute.key = 'Pending'
targets.execute.data = [1]
targets.reject.data = new Error('test')

// get all targets where event is execute

