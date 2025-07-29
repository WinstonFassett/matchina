import {
  FactoryMachineContext,
  FactoryMachineTransitionEvent,
} from "./factory-machine-types";
import { Simplify, FlatMemberUnionToIntersection } from "./utility-types";

// Utility type to extract parameter types from transition events
type ExtractParamTypes<FC extends FactoryMachineContext, StateKey extends keyof FC["transitions"], EventKey extends keyof FC["transitions"][StateKey]> = 
  FC["transitions"][StateKey][EventKey] extends keyof FC["states"]
    ? Parameters<FC["states"][FC["transitions"][StateKey][EventKey]]>
    : FC["transitions"][StateKey][EventKey] extends (...args: infer A) => (...innerArgs: any[]) => infer R
      ? A
      : FC["transitions"][StateKey][EventKey] extends (...args: infer A) => infer R
        ? A
        : any[];

export type FactoryMachineApi<FC extends FactoryMachineContext> = Simplify<
  object & FlatEventSenders<FC>
>;

export type WithApi<FC extends FactoryMachineContext> = FC & {
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
