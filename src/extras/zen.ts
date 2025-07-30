import { eventApi } from "../factory-machine-event-api";
import { FactoryMachine } from "../factory-machine-types";

/**
 * Enhances a FactoryMachine instance with event API and setup functionality.
 *
 * @template M - Type of FactoryMachine
 * @param {M} machine - The machine instance to enhance
 * @returns The enhanced machine with event API mixed in
 * @source
 */
export function assignEventApi<M extends FactoryMachine<any>>(machine: M) {
  return Object.assign(machine, eventApi(machine));
}
