import { StateEventTransitionSenders } from "./factory-machine-event-api";
import { MatchCases, MatchInvocation, match } from "./match-case";
import { StateFactory } from "./state";
import { ResolveEvent, StateMachine, StateMachineEvent } from "./state-machine";
import { createTransitionMachine } from "./transition-machine";
import {
  FlatMemberUnion,
  KeysWithZeroRequiredArgs,
} from "./utility-types";

export function createMachine<
  SF extends StateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends FactoryMachineEvent<FC> = FactoryMachineEvent<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryState<FC["states"]>,
): FactoryMachine<FC> {
  const initialState = (
    typeof init === "string" ? states[init]({}) : init
  ) as FactoryState<FC["states"]>;
  const machine = createTransitionMachine<E>(transitions as any, initialState);
  Object.assign(machine, {
    states,
    resolveExit: (ev: ResolveEvent<E>): E | undefined => {
      const to = nextFactoryState<FC>(transitions, states, ev);
      if (to) {
        return new FactoryMachineEventImpl<E>(
          ev.type,
          ev.from,
          to,
          ev.params,
        ) as E;
      }
    },
  });
  return machine as any;
}

class FactoryMachineEventImpl<E extends FactoryMachineEvent<any>> {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public type: E["type"],
    public from: E["from"],
    public to: E["to"],
    public params: E["params"],
  ) {}

  match<
    A,
    C extends MatchCases<any, A, Exhaustive>,
    Exhaustive extends boolean = false,
  >(cases: MatchCases<C, A, Exhaustive>, exhaustive: Exhaustive) {
    return match<any, A, Exhaustive>(
      exhaustive,
      cases,
      this.type,
      ...this.params,
    );
  }
}

export function nextFactoryState<FC extends FactoryMachineContext<any>>(
  transitions: FC["transitions"],
  states: FC["states"],
  ev: ResolveEvent<FactoryMachineEvent<FC>>,
) {
  const transition = transitions[ev.from.key]?.[ev.type];
  return resolveExitState(transition, ev, states);
}

export function resolveExitState<FC extends FactoryMachineContext<any>>(
  transition: FactoryMachineTransition<FC["states"]> | undefined,
  ev: ResolveEvent<FactoryMachineEvent<FC>>,
  states: FC["states"],
) {
  if (!transition) {
    return undefined;
  }
  if (typeof transition === "function") {
    const stateOrFn = transition(...ev.params);
    return typeof stateOrFn === "function" ? (stateOrFn as any)(ev) : stateOrFn;
  } else {
    return states[transition as keyof typeof states](...ev.params) as any;
  }
}

export interface TagDataCreators {
  [key: string]: (...args: unknown[]) => unknown;
}

export type FactoryState<
  States extends StateFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

export interface FactoryMachine<FC extends FactoryMachineContext<any>>
  extends StateMachine<FactoryMachineEvent<FC>> {
  states: FC["states"];
  transitions: FC["transitions"];
}

export interface FactoryMachineContext<
  SF extends StateFactory = StateFactory,
> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}

export type FactoryMachineTransitions<SF extends StateFactory> = {
  [FromStateKey in keyof SF]?: {
    [EventKey in string]?: FactoryMachineTransition<SF, FromStateKey, EventKey>;
  };
};

export type FactoryMachineTransition<
  SF extends StateFactory,
  FromStateKey extends keyof SF = keyof SF,
  EventKey extends string = any,
> =
  | keyof SF
  | ((...params: any[]) => FactoryState<SF>)
  | ((...params: any[]) => (
      ev: ResolveEvent<
        FactoryMachineEvent<{ states: SF; transitions: any }>
      > & {
        type: EventKey;
        from: FactoryState<SF, FromStateKey>;
      },
    ) => FactoryState<SF>);

/**
 * Union of events that can be sent to a factory machine
 */
export type FactoryMachineEvent<FC extends FactoryMachineContext<any>> = {
  [K in keyof FC["transitions"]]: {
    [E in keyof FC["transitions"][K]]: FactoryMachineTransitionEvent<FC, K, E>;
  }[keyof FC["transitions"][K]];
}[keyof FC["transitions"]];

type FactoryMachineEventApi<FC extends FactoryMachineContext<any>> = {
  get machine(): FactoryMachine<FC> & StateMachine<FactoryMachineEvent<FC>>;
  match: MatchInvocation<FlatMemberUnion<StateEventTransitionSenders<FC>>>;
};

/**
 * Resolves transition config to event and params
 * This is the configured event type, not the actual event type
 */
export type FactoryMachineTransitionEvent<
  FC extends FactoryMachineContext<any>,
  FromKey extends keyof FC["transitions"] = keyof FC["transitions"],
  EventKey extends
    keyof FC["transitions"][FromKey] = keyof FC["transitions"][FromKey],
  ToKey extends
    FC["transitions"][FromKey][EventKey] = FC["transitions"][FromKey][EventKey],
> = StateMachineEvent<FactoryState<FC["states"]>> &
  FactoryMachineEventApi<FC> & {
    from: FactoryState<
      FC["states"],
      FromKey extends keyof FC["states"] ? FromKey : any
    >;
    type: EventKey;
  } & (ToKey extends keyof FC["states"]
    ? {
        params: Parameters<FC["states"][ToKey]>;
        to: FactoryState<FC["states"], ToKey>;
      }
    : ToKey extends (...args: infer A) => (...innerArgs: any[]) => infer R
      ? {
          params: A;
          to: R;
        }
      : ToKey extends (...args: infer A) => infer R
        ? {
            params: A;
            to: R;
          }
        : never);
