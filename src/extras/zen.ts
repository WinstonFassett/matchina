import { setup } from "../ext";
import { FactoryMachine } from "../factory-machine-types";
import { createApi } from "../factory-machine-event-api";

export function zen<M extends FactoryMachine<any>>(machine: M) {
  return Object.assign(machine, createApi(machine), {
    setup: setup(machine),
  });
}

export type ZenMachine = ReturnType<typeof zen>;
