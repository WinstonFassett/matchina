import { setup } from "../ext";
import { FactoryMachine } from "../factory-machine";
import { createApi } from "../factory-machine-event-api";

export function zen<M extends FactoryMachine<any>>(machine: M) {
  const api = createApi(machine);
  const zenMachine = Object.assign(machine, api, {
    get state(): ReturnType<M["getState"]> {
      return machine.getState();
    },
    get change(): ReturnType<M["getChange"]> {
      return machine.getChange() as any;
    },
    // get machine() {
    //   return machine;
    // },
    setup: setup(machine),
  });
  return zenMachine;
  //  as M & typeof api;
}
export type ZenMachine<M extends FactoryMachine<any>> = M &
  ReturnType<typeof createApi<M>>;
