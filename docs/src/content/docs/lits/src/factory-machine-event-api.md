---
title: "factory-machine-event-api"
description: "Add description here"
---


```ts
import {
  FactoryMachine,
  FactoryMachineContext,
  FactoryMachineTransitionEvent,
} from "./factory-machine";
import { FlatMemberUnionToIntersection, Simplify } from "./utility-types";

export function createApi<
  M extends FactoryMachine<any>,
  K extends keyof M["transitions"] = keyof M["transitions"],
>(machine: M, filterStateKey?: K): FactoryMachineApi<M> {
  const { states, transitions } = machine;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      return machine.send(eventKey, ...(params as any));
    };

  const transitioners: any = {};
  const events: any = {};
  for (const stateKey in states) {
    if (filterStateKey && stateKey !== filterStateKey) {
      continue;
    }
    const transitionKey = stateKey as keyof typeof transitions;
    const stateTransitions = transitions[transitionKey];
    transitioners[transitionKey] = {};
    if (stateTransitions) {
      for (const eventKey in stateTransitions) {
        const sender = createSender(eventKey);
        transitioners[transitionKey][eventKey] = sender;
        events[eventKey] ||= sender;
      }
    }
  }
  return events;
}

export type FactoryMachineApi<FC extends FactoryMachineContext> = Simplify<
  object & FlatEventSenders<FC>
>;

export type WithApi<FC extends FactoryMachineContext> = FC & {
  api: FactoryMachineApi<FC>;
};

export function withApi<M extends FactoryMachine<any>>(target: M) {
  const enhanced = target as WithApi<M>;
  if (enhanced.api) {
    return enhanced;
  }
  return Object.assign(target, {
    api: createApi<M>(enhanced),
  }) as WithApi<M>;
}

export type FlatEventSenders<FC extends FactoryMachineContext> =
  FlatMemberUnionToIntersection<StateEventTransitionSenders<FC>>;

export type StateEventTransitionSenders<
  FC extends FactoryMachineContext,
  K extends keyof FC["transitions"] = keyof FC["transitions"],
> = {
  [StateKey in K]: {
    [EventKey in keyof FC["transitions"][StateKey]]: (
      ...args: FactoryMachineTransitionEvent<FC, StateKey, EventKey>["params"]
    ) => void;
  };
};
```
