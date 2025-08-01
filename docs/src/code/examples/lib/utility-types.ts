import type { FactoryMachineTransitions } from "matchina";

export type TransitionEntry<T extends FactoryMachineTransitions<any>> =
  T extends {
    [key: string]: { exit: infer E };
  }
    ? E
    : never;
