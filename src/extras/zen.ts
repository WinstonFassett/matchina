import { setup } from "../ext";
import { FactoryMachine } from "../factory-machine-types";
import { eventApi } from "../factory-machine-event-api";

type MachineWithEventApi<M extends FactoryMachine<any>> = M & ReturnType<typeof eventApi>;

/**
 * Enhances a FactoryMachine instance with event API and setup functionality.
 *
 * @template M - Type of FactoryMachine
 * @param {M} machine - The machine instance to enhance
 * @returns {MachineWithEventApi<M>} The enhanced machine with event API and setup method.
 * @source
 */
export function assignEventApi<M extends FactoryMachine<any>>(machine: M) {
  return Object.assign(machine, eventApi(machine))
}
