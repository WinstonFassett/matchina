import { StateMachineEvent, ResolveEvent, StateMachinery, createStateMachine } from "./state-machine";

export function createFactoryMachine<
  SF extends AnyStatesFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends AnyFactoryMachineEvent<FC> = AnyFactoryMachineEvent<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroArgs<FC['states']> | AnyFactoryState<FC['states']>,
): FactoryMachine<FC> {
  const initialState = (
    typeof init === "string" ? states[init]({}) : init
  ) as AnyFactoryState<FC['states']>;
  const machine = createStateMachine<E>(transitions, initialState);
  Object.assign(machine, {
    states,
    resolve: (ev: ResolveEvent<E>): E | undefined => {
      const to = nextFactoryState<FC>(transitions, states, ev);
      if (to) {
        return { ...ev, to } as E;
      }
    },
  });
  return machine as any;
}


type FunctionWithParameters<F> = F extends (...args: infer Args) => any
  ? Args extends []
    ? false
    : true
  : false;

type KeysWithZeroArgs<T> = {
  [K in keyof T]: FunctionWithParameters<T[K]> extends true ? never : K;
}[keyof T];


export function nextFactoryState<
  FC extends FactoryMachineContext<any>
>(transitions: FC['transitions'], states: FC['states'], ev: ResolveEvent<AnyFactoryMachineEvent<FC>>) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) {
    return undefined;
  }
  if (typeof to === "function") {
    const stateOrFn = to(...ev.params);
    return typeof stateOrFn === "function" ? (stateOrFn as any)(ev) : stateOrFn;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}


export type FactoryMachineTransitions<SF extends AnyStatesFactory> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]?:
      | keyof SF
      | ((...params: any[]) => AnyFactoryState<SF>)
      | ((...params: any[]) => (
          ev: ResolveEvent<AnyFactoryMachineEvent<{ states: SF, transitions: any }>> & {
            from: AnyFactoryState<SF, FromStateKey>;
          },
        ) => AnyFactoryState<SF>);
  };
};


export interface FactoryMachineContext<SF extends AnyStatesFactory = AnyStatesFactory> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}

export interface FactoryMachine<
    FC extends FactoryMachineContext<any>,    
  > extends StateMachinery<AnyFactoryMachineEvent<FC>> {
    states: FC['states'];
    transitions: FC['transitions'];
  }
  

  type FlatKeys<T> = {
    [K in keyof T]: keyof T[K];
  }[keyof T];

  
export interface AnyFactoryMachineEvent<FC extends FactoryMachineContext<any>> extends StateMachineEvent {
  // type: string & FlatKeys<FC['transitions']>;
  type: string & FlatEventKeys<FC>;
  params: any[];
  from: AnyFactoryState<FC['states']>;
  to: AnyFactoryState<FC['states']>;
  get machine(): FactoryMachine<FC> & StateMachinery<AnyFactoryMachineEvent<FC>>;
}

export type FlatEventKeys<
  FC extends FactoryMachineContext,
> = string &
  {
    [StateKey in keyof StateEventTransitionFuncs<FC>]: 
      keyof StateEventTransitionFuncs<FC>[StateKey];
  }[keyof StateEventTransitionFuncs<FC>];
// provides the return types of all state-event transitions

// export type FlatEventKeys<T> = {
//   [K in keyof T]: keyof T[K];
// }[keyof T];

export type StateFromFactory<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

export type AnyFactoryState<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

export type AnyStatesFactory = Record<string, (...params: any) => any>;
export type StateEventTransitionFuncs<
  FC extends FactoryMachineContext
> = {
    [TransitionStateKey in keyof FC['transitions']]: StateEventTransitionFunc<
      FC, TransitionStateKey
    >;
  };

  export type ResolvedFactoryTransition<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC['transitions'] = keyof FC['transitions'],
  Type extends keyof FC['transitions'][FromStateKey] = keyof FC['transitions'][FromStateKey],
  ToStateKey extends keyof FC['transitions'][FromStateKey][Type] = keyof FC['transitions'][FromStateKey][Type],
  Transitions extends FC["transitions"] = FC["transitions"],
  States extends FC["states"] = FC["states"],
  > = {
  [TransitionStateKey in keyof Transitions]: 
    TransitionStateKey extends FromStateKey ?
    object & {
      [EventKey in keyof Transitions[TransitionStateKey]]: 
      EventKey extends Type ?
      (
      {
        from: AnyFactoryState<
          States,
          TransitionStateKey extends keyof States ? TransitionStateKey : any
        >;
        type: EventKey;
      } & (Transitions[TransitionStateKey][EventKey] extends keyof States
        ? // if state key
          {
            params: Parameters<States[Transitions[TransitionStateKey][EventKey]]>;
            to: AnyFactoryState<
              States,
              Transitions[TransitionStateKey][EventKey]
            >;
          }
        : Transitions[TransitionStateKey][EventKey] extends (
            ...args: infer A
          ) => (...innerArgs: any[]) => infer R
        ? // if 2-stage function
          {
            params: A;
            to: R;
          }
        : // if 1-stage function
        Transitions[TransitionStateKey][EventKey] extends (
            ...args: infer A
          ) => infer R
        ? {
            params: A;
            to: R;
          }
        : never)
      ) : never;
    }[keyof Transitions[TransitionStateKey]]
    : never
  }[keyof Transitions];

  
type SelectEventType<T, V> = T extends { type: infer It } ? 
  It extends V ? T : never : never
type SelectFromKey<T, V> = T extends { from: { key: infer It } } ? 
  It extends V ? T : never : never
type SelectToKey<T, V> = T extends { to: { key: infer It} } ? 
  It extends V ? T : never : never

export type StateEventTransitionFunc<
  FC extends FactoryMachineContext,
  TransitionStateKey extends keyof FC['transitions'],
  Transitions extends FC['transitions'] = FC['transitions'],
  States extends FC['states'] = FC['states']
> = {
    [EventKey in keyof Transitions[TransitionStateKey] &
    string]: Transitions[TransitionStateKey][EventKey] extends keyof States ? (
      ...args: Parameters<States[Transitions[TransitionStateKey][EventKey]]>
    ) => AnyFactoryState<States, Transitions[TransitionStateKey][EventKey]> : Transitions[TransitionStateKey][EventKey] extends (
      ...args: infer A
    ) => (...innerArgs: any[]) => infer R ? (...args: A) => R : Transitions[TransitionStateKey][EventKey] extends (
      ...args: any[]
    ) => AnyFactoryState<States> ? (
      ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
    ) => AnyFactoryState<States> & {
      key: Transitions[TransitionStateKey][EventKey];
    } : never;
  };

  export type StateEventTransitionFunc2<
  FC extends FactoryMachineContext,
  TransitionStateKey extends keyof FC['transitions'],  
  > = 
  // {
  //   // [EventKey in keyof FC['transitions'][TransitionStateKey] &
  //   // string]: 
  // }
  ResolvedFactoryTransition<FC, TransitionStateKey>
  
  