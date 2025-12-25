import { FactoryMachineContext } from "./factory-machine-types";
import { FlatMemberUnionToIntersection, Simplify } from "./utility-types";

// Helper to extract params from a function (handles both curried and direct)
type FunctionParams<T> = T extends (...args: infer A) => any ? A : never;

// Utility type to extract parameter types from transition events
export type ExtractParamTypes<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"],
  EventKey extends keyof FC["transitions"][StateKey],
  Transition = FC["transitions"][StateKey][EventKey],
> = Transition extends keyof FC["states"]
  ? Parameters<FC["states"][Transition]>
  : FunctionParams<Transition>;

// Utility type to map event types to their parameter types
export type EventToParamTypes<FC extends FactoryMachineContext> = {
  [StateKey in keyof FC["transitions"]]: {
    [EventKey in keyof FC["transitions"][StateKey]]: {
      type: EventKey;
      params: ExtractParamTypes<FC, StateKey, EventKey>;
    };
  }[keyof FC["transitions"][StateKey]];
}[keyof FC["transitions"]];

export type FactoryMachineApi<FC extends FactoryMachineContext> = Simplify<
  object & FlatEventSenders<FC>
>;

export type addEventApi<FC extends FactoryMachineContext> = FC & {
  api: FactoryMachineApi<FC>;
};

export type FlatEventSenders<FC extends FactoryMachineContext> =
  FlatMemberUnionToIntersection<StateEventTransitionSenders<FC>>;

export type StateEventTransitionSenders<
  FC extends FactoryMachineContext,
  K extends keyof FC["transitions"] = keyof FC["transitions"],
> = {
  [StateKey in K]: {
    [EventKey in keyof FC["transitions"][StateKey]]: (
      // Use our utility type to extract the specific parameter types
      ...args: ExtractParamTypes<FC, StateKey, EventKey>
    ) => void;
  };
};
