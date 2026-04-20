import { eventApi } from "../factory-machine-event-api";
import type { FactoryMachineApi } from "../factory-machine-api-types";
import { FactoryMachine, FactoryMachineContext } from "../factory-machine-types";

/**
 * Enhances a FactoryMachine instance with event API and setup functionality.
 *
 * @template M - Type of FactoryMachine
 * @param {M} machine - The machine instance to enhance
 * @returns The enhanced machine with event API mixed in
 * @source
 */
type FCOf<M> = M extends FactoryMachine<infer FC>
  ? FC
  : M extends { states: infer S; transitions: infer T }
    ? S extends import("../state-keyed").KeyedStateFactory
      ? { states: S; transitions: T } extends FactoryMachineContext<any>
        ? { states: S; transitions: T }
        : never
      : never
    : never;

export function assignEventApi<
  M extends { states: any; transitions: any; send: any },
>(
  machine: M
): M &
  (FCOf<M> extends FactoryMachineContext<any>
    ? FactoryMachineApi<FCOf<M>>
    : unknown) {
  return Object.assign(machine, eventApi(machine as any)) as any;
}
