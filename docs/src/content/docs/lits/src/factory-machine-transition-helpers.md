---
title: "factory-machine-transition-helpers"
description: "Add description here"
---


```ts
import { FactoryMachineEvent } from "./factory-machine";
import { ResolveEvent, StateMachineEvent } from "./state-machine";

const { assign } = Object;

export const updateState =
  <E extends FactoryMachineEvent<any>>(
    updater: (fromData: E["from"]["data"]) => any,
  ) =>
  (ev: ResolveEvent<E>): E["to"] => ({
    // ...ev,
    // to: {

    ...ev.from,
    data: {
      ...ev.from.data,
      ...updater(ev.from.data),
    },

    // },
  });

export function setInState<E extends FactoryMachineEvent<any>>(
  state: Partial<E["to"]["data"]>,
) {
  return (ev: E) => {
    return { ...ev.from.data, ...state };
  };
}
export function forwardData<
  StateFunc extends (current: any, updates: any) => any,
  DataFunc extends (...args: any[]) => Parameters<StateFunc>[1],
>(createState: StateFunc, getData: DataFunc) {
  return (...params: Parameters<DataFunc>) => {
    return (ev: FactoryMachineEvent<any>) => {
      return createState(ev.from.data, getData(...params));
    };
  };
}
```
