import { setup } from "../ext";
import { FactoryMachine, FactoryMachineContext } from "../factory-machine";
import { createApi } from "../factory-machine-event-api";

export function zen<M extends FactoryMachine<any>>(machine: M) {
  const api = createApi(machine);
  return {
    ...api,
    get state(): ReturnType<M["getState"]> {
      return machine.getState();
    },
    get change(): ReturnType<M["getChange"]> {
      return machine.getChange() as any;
    },
    get machine() {
      return machine;
    },
    setup: setup(machine),
  };
}
