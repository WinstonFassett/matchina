import {
  StateEventTransitionSenders,
  ExtractParamTypes,
} from "./factory-machine-api-types";
import { MatchInvocation } from "./match-case-types";
import { FactoryKeyedState, KeyedStateFactory } from "./state-keyed";
import { StateMachine, TransitionEvent } from "./state-machine";
import { ResolveEvent } from "./state-machine-types";
import { FlatMemberUnion } from "./utility-types";

/**
 * Utility type to extract parameter types for a specific event type in a factory machine.
 * Iterates once over states, using conditional to match the target event.
 * Uses `string &` constraint to prevent key type explosion.
 */
export type ExtractEventParams<
  FC extends FactoryMachineContext<any>,
  T extends string,
> = {
  [K in string & keyof FC["transitions"]]: T extends keyof FC["transitions"][K]
    ? ExtractParamTypes<FC, K, T>
    : never;
}[string & keyof FC["transitions"]];

export interface FactoryMachineContext<
  SF extends KeyedStateFactory = KeyedStateFactory,
> {
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
 */
export interface FactoryMachine<
  FC extends FactoryMachineContext<any> = FactoryMachineContext,
> extends Omit<StateMachine<FactoryMachineEvent<FC>>, "send" | "getState"> {
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
    ...params: NormalizeParams<ExtractEventParams<FC, T>>
  ): void;

  /**
   * Strongly-typed current state accessor: returns a state produced by this machine's state factory.
   * This avoids over-narrowing via event unions that can drop some states from the type.
   */
  getState(): FactoryKeyedState<FC["states"]>;
}

// If param inference produces a non-array (e.g., never), normalize to [] so zero-arg events are callable.
type NormalizeParams<P> = [P] extends [never]
  ? []
  : P extends any[]
    ? P
    : [];

/**
 * @interface
 * FactoryMachineTransitions defines the structure for transitions in a FactoryMachine.
 * Each state key maps to an object where each event type maps to a transition function or state key.
 * This allows for flexible and type-safe transitions between states.
 * Example:
 * ```ts
 * const transitions: FactoryMachineTransitions<MyStateFactory> = {
 *   Idle: {
 *     start: "Running",
 *     reset: (ev) => ev.from,
 *   },
 *   Running: {
 *     complete: "Idle",
 *     error: (ev) => ({ ...ev.from, error: true }),
 *   },
 * };
 * ```
 * This structure allows you to define transitions in a way that is both type-safe and flexible,
 * enabling you to use either direct state keys or transition functions that can take parameters.
 * @source This is the core type for defining transitions in a FactoryMachine.
 * It allows you to specify how each state can transition to another state based on events.
 * It supports both direct state transitions and transition functions that can take parameters.
 * This structure is essential for building complex state machines with clear and type-safe transitions.
 * @template SF - The state factory type that defines the states available in the machine.
 * @template TR - The transition record type that maps event types to transition functions or state keys
 */
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
    ) => FactoryKeyedState<SF> | null | undefined);

/**
 * Union of all possible transition events for a factory machine.
 * Uses `string &` constraints to prevent string|number|symbol key explosion.
 */
export type FactoryMachineEvent<FC extends FactoryMachineContext<any>> = {
  [K in string & keyof FC["transitions"]]: {
    [E in string & keyof FC["transitions"][K]]: FactoryMachineTransitionEvent<FC, K, E>;
  }[string & keyof FC["transitions"][K]];
}[string & keyof FC["transitions"]];

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
}; // Valid state keys and event types for a given context

export type StateKey<FC extends FactoryMachineContext> = keyof FC["states"];
export type EventType<FC extends FactoryMachineContext> =
  FactoryMachineEvent<FC>["type"];
