import { StateEventTransitionSenders } from "./factory-event-api";
import { MatchInvocation } from "./match";
import { HasFilterValues } from "./match-property-filters";
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
    FlatMemberUnion<StateEventTransitionSenders<FC>>
  >
}

export type FlatEventKeys<FC extends FactoryMachineContext> = string &
  {
    [StateKey in keyof FC['transitions']]: keyof FC['transitions'][StateKey];
  }[keyof FC['transitions']];
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

export type FactoryEventResolved<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"] = keyof FC["transitions"],
  Type extends keyof FC["transitions"][FromStateKey] = keyof FC["transitions"][FromStateKey],
  ToStateKey extends keyof FC["transitions"][FromStateKey][Type] = keyof FC["transitions"][FromStateKey][Type],
> = FactoryEvent<FC> & HasFilterValues<
  FactoryEvent<FC>,
  {
    from: StateFromFactory<FC["states"], FromStateKey extends keyof FC['states'] ? FromStateKey : any>;
    type: Type;
    to: StateFromFactory<FC["states"], ToStateKey extends keyof FC['states'] ? ToStateKey : any>;
  }
>

export type FactoryTransitionFromContext<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"] = keyof FC["transitions"],
  Type extends keyof FC["transitions"][FromStateKey] = keyof FC["transitions"][FromStateKey],
> = FactoryEventResolved<
  FC,
  FromStateKey,
  Type
>

// export type FactoryEventTypeKeys<FC extends FactoryMachineContext> = {
//   [K in keyof FC["transitions"]]: {
//     [E in keyof FC["transitions"][K]]: ExitPropKeys<FC, K, E>;
//   }[keyof FC["transitions"][K]];
// }[keyof FC['transitions']];

export type FactoryEvent<FC extends FactoryMachineContext> = {
  [K in keyof FC["transitions"]]: {
    [E in keyof FC["transitions"][K]]: ExitProps<FC, K, E>;
  }[keyof FC["transitions"][K]];
}[keyof FC['transitions']];
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
  (ToKey extends keyof FC['states'] ? {
    params: Parameters<FC['states'][ToKey]>;
    to: StateFromFactory<FC['states'], ToKey>;
  } : ToKey extends (...args: infer A) => (...innerArgs: any[]) => infer R ? {
    params: A;
    to: R;
  } : ToKey extends (...args: infer A) => infer R ? {
    params: A;
    to: R;
  } : never);
