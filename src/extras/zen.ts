import { setup } from "../ext";
import { FactoryMachine } from "../factory-machine-types";
import { createApi } from "../factory-machine-event-api";

type ZenMachine<M extends FactoryMachine<any>> = M & ReturnType<typeof createApi> & { setup: ReturnType<typeof setup<M>> };

/**
 * Enhances a FactoryMachine instance with event API and setup functionality.
 *
 * @template M - Type of FactoryMachine
 * @param {M} machine - The machine instance to enhance
 * @returns {ZenMachine<M>} The enhanced machine with event API and setup method.
 * @source
 */
export function zen<M extends FactoryMachine<any>>(machine: M): ZenMachine<M> {
  return Object.assign(machine, createApi(machine), {
    setup: setup(machine),
  }) as ZenMachine<M>;
}
