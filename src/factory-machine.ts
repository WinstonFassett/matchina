import { StateEventTransitionSenders } from "./factory-event-api";
import { MatchInvocation } from "./match";
import { ExitPropKeys, ExitProps } from "./promise";
import {
  ResolveEvent,
  StateMachine,
  StateMachineEvent,
  createStateMachine,
} from "./state-machine";
import { FlatMemberUnion } from "./utility-types";

export function createFactoryMachine<
  SF extends AnyStatesFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends AnyFactoryMachineEvent<FC> = AnyFactoryMachineEvent<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroArgs<FC["states"]> | AnyFactoryState<FC["states"]>,
): FactoryMachine<FC> {
  const initialState = (
    typeof init === "string" ? states[init]({}) : init
  ) as AnyFactoryState<FC["states"]>;
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

export function nextFactoryState<FC extends FactoryMachineContext<any>>(
  transitions: FC["transitions"],
  states: FC["states"],
  ev: ResolveEvent<AnyFactoryMachineEvent<FC>>,
) {
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
          ev: ResolveEvent<
            AnyFactoryMachineEvent<{ states: SF; transitions: any }>
          > & {
            from: AnyFactoryState<SF, FromStateKey>;
          },
        ) => AnyFactoryState<SF>);
  };
};

export interface FactoryMachineContext<
  SF extends AnyStatesFactory = AnyStatesFactory,
> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}

export interface FactoryMachine<FC extends FactoryMachineContext<any>>
  extends StateMachine<AnyFactoryMachineEvent<FC>> {
  states: FC["states"];
  transitions: FC["transitions"];
}

export interface AnyFactoryMachineEvent<FC extends FactoryMachineContext<any>>
  extends StateMachineEvent {
  type: string & FlatEventKeys<FC>;
  params: any[];
  from: AnyFactoryState<FC["states"]>;
  to: AnyFactoryState<FC["states"]>;
  get machine(): FactoryMachine<FC> &
    StateMachine<AnyFactoryMachineEvent<FC>>;
  match: MatchInvocation<
    // FlatMemberUnion<StateEventTransitionFuncs<FC>>
    // <StateEventTransitionFuncs<FC>[keyof StateEventTransitionFuncs<FC>]
    FlatMemberUnion<StateEventTransitionSenders<FC>>
  >
}

export type FlatEventKeys<FC extends FactoryMachineContext> = string &
  {
    [StateKey in keyof StateEventTransitionFuncs<FC>]: keyof StateEventTransitionFuncs<FC>[StateKey];
  }[keyof StateEventTransitionFuncs<FC>];
// provides the return types of all state-event transitions

export type StateFromFactory<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

export type AnyFactoryState<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

export type AnyStatesFactory = Record<string, (...params: any) => any>;
export type StateEventTransitionFuncs<FC extends FactoryMachineContext> = {
  [TransitionStateKey in keyof FC["transitions"]]: StateEventTransitionFunc<
    FC,
    TransitionStateKey
  >;
};

export type FactoryTransitionsFromContext<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"] =  keyof FC["transitions"],
  Type extends
    keyof FC["transitions"][FromStateKey] = keyof FC["transitions"][FromStateKey],
  Transitions extends FC["transitions"] = FC["transitions"],
  States extends FC["states"] = FC["states"],
> = {
  [TransitionStateKey in keyof Transitions]: TransitionStateKey extends FromStateKey
    ? object &
        {
          [EventKey in keyof Transitions[TransitionStateKey]]: EventKey extends Type
            ? {
                from: AnyFactoryState<
                  States,
                  TransitionStateKey extends keyof States
                    ? TransitionStateKey
                    : any
                >;
                type: EventKey;
              } & (Transitions[TransitionStateKey][EventKey] extends keyof States
                ? // if state key
                  {
                    params: Parameters<
                      States[Transitions[TransitionStateKey][EventKey]]
                    >;
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
            : never;
        }[keyof Transitions[TransitionStateKey]]
    : never;
};

export type FactoryTransitionFromContext<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"] = keyof FC["transitions"],
  Type extends
    keyof FC["transitions"][FromStateKey] = keyof FC["transitions"][FromStateKey],
> = FactoryTransitionsFromContext<
  FC,
  FromStateKey,
  Type
>[keyof FC["transitions"]];

export type AnyFactoryMachineTransition<
  FC extends FactoryMachineContext<any>,
  FromStateKey extends keyof FC["transitions"] = any,
  Type extends keyof FC["transitions"][FromStateKey] = any,
  ToStateKey extends keyof FC["transitions"][FromStateKey][Type] = any,
  RFT extends FactoryTransitionFromContext<
    FC,
    FromStateKey,
    Type
  > = FactoryTransitionFromContext<FC, FromStateKey, Type>,
> = RFT extends { to: { key: infer It } }
  ? It extends ToStateKey
    ? RFT
    : never
  : never;

export type StateEventTransitionFunc<
  FC extends FactoryMachineContext,
  TransitionStateKey extends keyof FC["transitions"],
  Transitions extends FC["transitions"] = FC["transitions"],
> = {
  [EventKey in keyof Transitions[TransitionStateKey] &
    string]: FactoryTransitionFromContext<
    FC,
    TransitionStateKey,
    EventKey
  > extends undefined
    ? never
    : (
        ...params: FactoryTransitionFromContext<
          FC,
          TransitionStateKey,
          EventKey
        >["params"]
      ) => FactoryTransitionFromContext<FC, TransitionStateKey, EventKey>["to"];
};

export type FactoryEventTypeKeys<FC extends FactoryMachineContext> = {
  [K in keyof FC["transitions"]]: {
    [E in keyof FC["transitions"][K]]: ExitPropKeys<FC, K, E>;
  }[keyof FC["transitions"][K]];
}[keyof FC['transitions']];

export type FactoryEvent<FC extends FactoryMachineContext> = {
  [K in keyof FC["transitions"]]: {
    [E in keyof FC["transitions"][K]]: ExitProps<FC, K, E>;
  }[keyof FC["transitions"][K]];
}[keyof FC['transitions']];