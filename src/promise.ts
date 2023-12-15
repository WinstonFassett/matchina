import { StateEventTransitionSenders } from "./factory-event-api";
import { AnyFactoryMachineEvent, AnyFactoryState, FactoryEvent, FactoryMachineContext, StateEventTransitionFuncs, StateFromFactory, createFactoryMachine } from "./factory-machine";
import { States, defineStates } from "./states";
import { FlatMemberUnion, FlatMemberUnionToIntersection } from "./utility-types";

export type PromiseStateDataCreators<F extends PromiseCallback, E = Error> = States<{
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
}>;

export const promiseStates = defineStates({
  Idle: undefined,
  Pending: (...params: any[]) => params,
  Rejected: (error: any) => error,
  Resolved: (data: any) => data,
});

type PromiseStatesFactory<F extends PromiseCallback> = ReturnType<typeof defineStates<PromiseStateDataCreators<F>>>;

type PromiseState<
  F extends PromiseCallback,
  K extends keyof PromiseStateDataCreators<F> = keyof PromiseStateDataCreators<F>,
> = AnyFactoryState<PromiseStatesFactory<F>, K>;

type Idle = PromiseState<any, 'Idle'>;

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
  const states = promiseStates as unknown as PromiseStateDataCreators<F>;
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
export type PromiseStateKey = keyof PromiseStateDataCreators<any>;

// type EVK = FactoryEventTypeKeys<PromiseMachine<any>>

type EVE= FactoryEvent<PromiseMachine<any>>
type PEVE = EVE['to']['key']
type EFC = FactoryTransitionMapFromContext3<PromiseMachine<any>>

type PEFC = OmitEmpty<EFC>

// type FlatEFC = FlatMemberUnion<EFC>

type OmitEmpty<T> = {
  [K in keyof T as (T[K] extends {} ? keyof T[K] extends never ? never : K : K)]: T[K];
};

type PrunedEFC = OmitEmpty<EFC>;

const efc = {} as PrunedEFC 


type PC = {
  transitions: PromiseTransitions;
  states: PromiseStateDataCreators<any>;
}
type X = StateEventTransitionFuncs<PC>;

type X2 = FlatMemberUnion<StateEventTransitionSenders<PC>>
type X3 = FlatMemberUnionToIntersection<StateEventTransitionSenders<PC>>

const x2 = {} as X2
const x3 = {} as X3


type TestType = {
  empty: {}
  notEmpty: { aKey: true }
}
type FilterEmptyNeverKeys<T> = {
  [K in keyof T as T[K] extends never | '' ? never : K]: T[K];
};

// Example usage
type MyObject = {
  name: string;
  age: number;
  city: '' | 'New York';
  country: never | 'USA';
};

type FilteredObject = FilterEmptyNeverKeys<TestType>;

// FilteredObject will be:
// {
//   name: string;
//   age: number;
//   city: 'New York';
// }

// type X5 = NonEmptyObjectKeys<TestType>

type FactoryTransitionMapFromContext3<
  FC extends FactoryMachineContext
> = {
  [StateKey in keyof FC["transitions"]]: {
    [EventKey in keyof FC["transitions"][StateKey]]:     
      ExitPropKeys<FC, StateKey, EventKey>;
  }
}

export type ExitProps<
  FC extends FactoryMachineContext,
  FromKey extends keyof FC["transitions"] = keyof FC["transitions"],
  EventKey extends keyof FC["transitions"][FromKey] = keyof FC["transitions"][FromKey],
  ToKey extends FC['transitions'][FromKey][EventKey] = FC['transitions'][FromKey][EventKey]
  > = 
  AnyFactoryMachineEvent<FC> &
  {
    from: StateFromFactory<FC['states'], FromKey extends keyof FC['states'] ? FromKey : any>;
    type: EventKey;          
  } &
  (
    ToKey extends keyof FC['states'] ? 
    {    
      params: Parameters<FC['states'][ToKey]>;
      to: StateFromFactory<FC['states'], ToKey>;
    }
    : 
    ToKey extends (...args: infer A) => (...innerArgs: any[]) => infer R ?
    {
      // from: FromKey;
      // type: EventKey; 
      params: A;
      to: R;
    }
    : 
    ToKey extends (...args: infer A) => infer R ?
    {
      // from: FromKey;
      // type: EventKey; 
      params: A;
      to: R;
    }
    :
    never
  )

export type ExitPropKeys<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"] = keyof FC["transitions"],
  EventKey extends keyof FC["transitions"][StateKey] = keyof FC["transitions"][StateKey],
  Transition extends FC['transitions'][StateKey][EventKey] = FC['transitions'][StateKey][EventKey]
  > = 
  Transition extends keyof FC['states'] ? 
  {    
    from: StateKey;
    type: EventKey;          
    params: Parameters<FC['states'][Transition]>;
    to: Transition;
  }
  : 
  Transition extends (...args: infer A) => (...innerArgs: any[]) => infer R ?
  {
    from: StateKey;
    type: EventKey; 
    params: A;
    to: R;
  }
  : 
  Transition extends (...args: infer A) => infer R ?
  {
    from: StateKey;
    type: EventKey; 
    params: A;
    to: R;
  }
  :
  never
