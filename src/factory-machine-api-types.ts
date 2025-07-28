import { FactoryMachineContext, FactoryMachineTransitionEvent } from "./factory-machine-types";
import { Simplify, FlatMemberUnionToIntersection } from "./utility-types";


export type FactoryMachineApi<FC extends FactoryMachineContext> = Simplify<
  object & FlatEventSenders<FC>
>;

export type WithApi<FC extends FactoryMachineContext> = FC & {
  api: FactoryMachineApi<FC>;
};

export type FlatEventSenders<FC extends FactoryMachineContext> = FlatMemberUnionToIntersection<StateEventTransitionSenders<FC>>;

export type StateEventTransitionSenders<
  FC extends FactoryMachineContext,
  K extends keyof FC["transitions"] = keyof FC["transitions"]
> = {
    [StateKey in K]: {
      [EventKey in keyof FC["transitions"][StateKey]]: (
        ...args: FactoryMachineTransitionEvent<FC, StateKey, EventKey>["params"]
      ) => void;
    };
  };
