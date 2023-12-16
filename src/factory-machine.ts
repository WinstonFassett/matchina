import { StateEventTransitionSenders } from "./factory-event-api";
import { MatchInvocation } from "./match";
import { HasFilterValues } from "./match-property-filters";
import {
  ResolveEvent,
  StateMachine,
  StateMachineEvent,
  createStateMachine,
} from "./state-machine";
import { KeysWithZeroArgs } from "./utility-types";
import { FlatMemberUnion } from "./utility-types";

export function createFactoryMachine<
  SF extends AnyStatesFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends FactoryMachineEventUnion<FC> = FactoryMachineEventUnion<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroArgs<FC["states"]> | StateFromFactory<FC["states"]>,
): FactoryMachine<FC> {
  const initialState = (
    typeof init === "string" ? states[init]({}) : init
  ) as StateFromFactory<FC["states"]>;
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

export function nextFactoryState<FC extends FactoryMachineContext<any>>(
  transitions: FC["transitions"],
  states: FC["states"],
  ev: ResolveEvent<FactoryMachineEventUnion<FC>>,
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


export interface FactoryMachine<FC extends FactoryMachineContext<any>>
  extends StateMachine<FactoryMachineEventUnion<FC>> {
  states: FC["states"];
  transitions: FC["transitions"];
}

export interface FactoryMachineContext<
  SF extends AnyStatesFactory = AnyStatesFactory,
> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}

export type FactoryMachineTransitions<SF extends AnyStatesFactory> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]?:
      | keyof SF
      | ((...params: any[]) => StateFromFactory<SF>)
      | ((...params: any[]) => (
          ev: ResolveEvent<
          FactoryMachineEventUnion<{ states: SF; transitions: any }>
          > & {
            from: StateFromFactory<SF, FromStateKey>;
          },
        ) => StateFromFactory<SF>);
  };
};

interface AnyFactoryMachineEvent<FC extends FactoryMachineContext<any>>
  extends StateMachineEvent {
  // type: string & FlatEventKeys<FC>;
  // params: any[];
  from: StateFromFactory<FC["states"]>;
  to: StateFromFactory<FC["states"]>;
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

export type AnyStatesFactory = Record<string, (...params: any) => any>;


/**
 * Union of events that can be sent to a factory machine
 */
export type FactoryMachineEventUnion<FC extends FactoryMachineContext<any>> = {
  [K in keyof FC["transitions"]]: {
    [E in keyof FC["transitions"][K]]:       
      FactoryMachineEvent<FC, K, E>;
  }[keyof FC["transitions"][K]];
}[keyof FC['transitions']];


/**
 * Resolves transition config to event and params
 * This is the configured event type, not the actual event type
 */
export type FactoryMachineEvent<
  FC extends FactoryMachineContext<any>,
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
  } : never)
  ;
