import { StateEventTransitionSenders, ExtractParamTypes } from "./factory-machine-api-types";
import { MatchInvocation } from "./match-case-types";
import { FactoryKeyedState } from "./state-keyed";
import { KeyedStateFactory } from "./state-keyed";
import { StateMachine, TransitionEvent } from "./state-machine";
import { ResolveEvent } from "./state-machine-types";
import { FlatMemberUnion } from "./utility-types";

/**
 * Utility type to extract parameter types for a specific event type in a factory machine.
 * This type properly handles required parameters and default parameters.
 */
export type ExtractEventParams<
  FC extends FactoryMachineContext<any>,
  T extends string
> = {
  [StateKey in keyof FC["transitions"]]: {
    [EventKey in keyof FC["transitions"][StateKey] & string]: 
      EventKey extends T ? 
        ExtractParamTypes<FC, StateKey, EventKey> : 
        never
  }[keyof FC["transitions"][StateKey] & string]
}[keyof FC["transitions"]]



export interface FactoryMachineContext<SF extends KeyedStateFactory = KeyedStateFactory> {
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
export interface FactoryMachine<FC extends FactoryMachineContext<any> = FactoryMachineContext>
  extends Omit<StateMachine<FactoryMachineEvent<FC>>, 'send'> {
  states: FC["states"];
  transitions: FC["transitions"];
  
  /**
   * Send an event to the state machine with strongly typed parameters based on the event type.
   * This overrides the base StateMachine send method to provide better type checking.
   * 
   * @param type - The event type to send
   * @param params - The parameters for the event, typed based on the event type
   */
  send<T extends FactoryMachineEvent<FC>["type"]>(
    type: T,
    ...params: ExtractEventParams<FC, T>
  ): void;
}

export type FactoryMachineTransitions<SF extends KeyedStateFactory> = {
  [FromStateKey in keyof SF]?: {
    [EventKey in string]?: FactoryMachineTransition<SF, FromStateKey, EventKey>;
  };
};

export type FactoryMachineTransition<
  SF extends KeyedStateFactory,
  FromStateKey extends keyof SF = keyof SF,
  EventKey extends string = any,
> =
  | keyof SF
  | ((...params: any[]) => FactoryKeyedState<SF>)
  | ((...params: any[]) => (
      ev: ResolveEvent<
        FactoryMachineEvent<{ states: SF; transitions: any }>
      > & {
        type: EventKey;
        from: FactoryKeyedState<SF, FromStateKey>;
      }
    ) => ReturnType<SF[keyof SF]>);

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
> = TransitionEvent<FactoryKeyedState<FC["states"]>> &
  FactoryMachineEventApi<FC> & {
    from: FactoryKeyedState<
      FC["states"],
      FromKey extends keyof FC["states"] ? FromKey : any
    >;
    type: EventKey;
  } & (ToKey extends keyof FC["states"]
    ? {
        to: FactoryKeyedState<FC["states"], ToKey>;
      }
    : ToKey extends (...args: any[]) => (...innerArgs: any[]) => infer R
      ? {
          to: R;
        }
      : ToKey extends (...args: any[]) => infer R
        ? {
            to: R;
          }
        : never);
type FactoryMachineEventApi<FC extends FactoryMachineContext<any>> = {
  get machine(): FactoryMachine<FC> & StateMachine<FactoryMachineEvent<FC>>;
  match: MatchInvocation<FlatMemberUnion<StateEventTransitionSenders<FC>>>;
};// Valid state keys and event types for a given context

export type StateKey<FC extends FactoryMachineContext> = keyof FC["states"];
export type EventType<FC extends FactoryMachineContext> = FactoryMachineEvent<FC>["type"];
