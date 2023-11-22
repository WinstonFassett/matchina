import { setup } from "./setup";
import { HasMethod, methodListen, methodUse, methodUseV2, methodV2 } from "./method";
import { AnyStateMachinery, StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

//#region interceptors
export const send = methodUse('send');
export const transition = methodUse('transition');
export const guard =
  <T extends HasMethod<'guard'>>(
    fn: T['guard']
  ) => methodUseV2('guard')(inner => (...params) => {
    return inner(...params) && fn(inner)(...params)
  }); 
export const handle = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["handle"],
) =>
  methodUseV2("handle")<AnyStateMachinery>(
    inner => ev => fn(inner(ev)),
  );     
//#endregion

//#region effects
export const effect = methodListen('effect');
export const before = methodListen('before');
export const after = methodListen('after');
export const notify = methodListen('notify');
//#endregion

export function machineSetup<M>(...extenders: ((machine: M) => () => void)[]) {
  return function setupMachine(machine: M) {
    return setup(...extenders.map(fn => fn(machine)));
  };
}

export function setupMachine<M>(machine: M) {
  return function (...extenders: ((machine: M) => () => void)[]) {
    return setup(...extenders.map(fn => fn(machine)));
  };
}
