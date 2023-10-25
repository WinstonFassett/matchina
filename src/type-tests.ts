// #region Usage code for testing types. DO NOT REGENERATE THIS. THE FOCUS IS ABOVE THIS LINE

import { createPromiseMachine } from "./extras/promise";
import { MatchboxFactory } from "./matchbox-types";
import { StateFromFactory } from "./states";
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
  FlatMachineEventToTargetKeyMap,
  FlatEventTargetsMap,
  Filter,
  
  FlatEventTargets,
  FlattenedTargets,
  FlattenMembers,
  FlatStateEventTransitionTargets,
  StateTransitions,
  StateTransitionTargetKeys,  
  FlattenTransitionTargetKeys,
  FlattenReturnStateTargetKeys,
  FlatMachineReturnEventToTargetKeyMap,
  FlattenReturnStateTargetTypes,
  FlattenReturnStateTargets,
  FlatMemberUnionToIntersection,
  FlatStateTransitionTargetIntersection,
  FlatStateTransitionTargets,
  TUnionToIntersection,
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
const { states } = m.def
type MyState = StateFromFactory<typeof states>
type Events = FlatMachineEvents<typeof m>; // data but no typed keys
type Eventers = FlatMachineEventers<typeof m>;
type Targets = FlatMachineEventTargets<typeof m>; // data but not typed keys
type TargetKeyMap = FlatMachineEventToTargetKeyMap<typeof m>; /*
results in:
  type TargetKeyMap = {
      resolve: "Resolved";
      reject: "Rejected";
  } & {} & {} & {
      execute: "Pending";
  } & {}
*/
type TargetKeys = TargetKeyMap[keyof TargetKeyMap]; /*
results in "Pending" | "Rejected" | "Resolved" and excludes "Idle"
*/

const events = {} as Events;
events.execute(1, 2).key = "Pending";
events.execute(1, 2).data = [1];

const targets = {} as Targets;
targets.execute.key = "Pending";
targets.execute.data = [1];
targets.reject.data = new Error("test");

// get all targets where event is execute
type Filter1<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never;
}[keyof T];


type Execute = Filter<Event, "reject">;
type ExecuteSender = Filter<Eventers, "reject">;
type ExecuteToPending = Filter<Targets, "reject">;
type ExecuteTargetKeys = Filter<TargetKeyMap, "reject">;

let state: ReturnType<typeof m.getState> = m.getState()
state = {} as ExecuteToPending


let s2: MyState = {} as ExecuteToPending

type T3 = FlatEventTargets<typeof m.def.states, typeof m.def.transitions>
type T4 = FlattenMembers<T3>

type Thing = T4

type T5 = T4[keyof T4]
type T6 = T3[keyof T3]
type T7= T6[keyof T6]

type TX = StateTransitions<typeof m.def.states, typeof m.def.transitions>


type TT = FlatStateEventTransitionTargets<StateTransitions<typeof m.def.states, typeof m.def.transitions>>
type TK = StateTransitionTargetKeys<typeof m.def.states, typeof m.def.transitions>
type TE = FlattenedEventTypes<typeof m.def.states, typeof m.def.transitions>

// type TFK = FlattenTransitionTargetKeys<typeof m.def.states, typeof m.def.transitions>
// const a: TFK = "Not a Valid State"

// YES! this is what I want
type TargetKeys2 = FlattenReturnStateTargetKeys<typeof m.def.states, typeof m.def.transitions>

// now can I get the types...
type TargetTypes = FlattenReturnStateTargets<typeof m.def.states, typeof m.def.transitions>

type EventsToStateKeys = FlatMachineEventToTargetKeyMap<typeof m>  
type W3 = FlatMachineReturnEventToTargetKeyMap<typeof m> // hmm this is never

const t: TargetTypes = {
  key: 'Rejected',
  data: new Error('test'),
  match: (x) => x as any
}

type STT = StateTransitionTargets<typeof m.def.states, typeof m.def.transitions>
type STFlatMemberUnion = FlatMemberUnionToIntersection<StateTransitionTargets<typeof m.def.states, typeof m.def.transitions>>

type Compare = FlatStateTransitionTargetIntersection<typeof m.def.states, typeof m.def.transitions>['reject']
type Compare2 = TUnionToIntersection<FlatStateTransitionTargets<typeof m.def.states, typeof m.def.transitions>>
type ForReject = Compare2['reject']
const x: ForReject = {} as any
m.getChange().to = x

// ['reject']

type STFiltered = STFlatMemberUnion['reject']