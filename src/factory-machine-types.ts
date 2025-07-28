import { StateEventTransitionSenders } from "./factory-machine-api-types";
import { MatchInvocation } from "./match-case-types";
import { FactoryState, StateFactory } from "./factory-state";
import { StateMachine, TransitionEvent } from "./state-machine";
import { ResolveEvent } from "./state-machine-types";
import { FlatMemberUnion } from "./utility-types";

export interface FactoryMachineContext<SF extends StateFactory = StateFactory> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}

/**
 * FactoryMachine is a type-safe state machine that uses a state factory and transitions.
 * It extends the StateMachine interface to provide additional functionality
 * specific to factory-based state machines.
 *
 * See also:
 *   - {@link createMachine} to create a FactoryMachine instance.
 *   - {@link TransitionMachine} for a less-typed, event-based state machine.
 *   - {@link createTransitionMachine} is used internally by FactoryMachine
 */
export interface FactoryMachine<FC extends FactoryMachineContext<any>>
  extends StateMachine<FactoryMachineEvent<FC>> {
  states: FC["states"];
  transitions: FC["transitions"];
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
      }
    ) => FactoryState<SF>);

export type FactoryMachineEvent<FC extends FactoryMachineContext<any>> = {
  [K in keyof FC["transitions"]]: {
    [E in keyof FC["transitions"][K]]: FactoryMachineTransitionEvent<FC, K, E>;
  }[keyof FC["transitions"][K]];
}[keyof FC["transitions"]];

export type FactoryMachineTransitionEvent<
  FC extends FactoryMachineContext<any>,
  FromKey extends keyof FC["transitions"] = keyof FC["transitions"],
  EventKey extends
    keyof FC["transitions"][FromKey] = keyof FC["transitions"][FromKey],
  ToKey extends
    FC["transitions"][FromKey][EventKey] = FC["transitions"][FromKey][EventKey],
> = TransitionEvent<FactoryState<FC["states"]>> &
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
type FactoryMachineEventApi<FC extends FactoryMachineContext<any>> = {
  get machine(): FactoryMachine<FC> & StateMachine<FactoryMachineEvent<FC>>;
  match: MatchInvocation<FlatMemberUnion<StateEventTransitionSenders<FC>>>;
};
