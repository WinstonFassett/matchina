import { setup } from "./setup";
import { methodUse } from "./method";

export const guard = methodUse('guard');
export const handle = methodUse('handle');
export const effect = methodUse('effect');
export const before = methodUse('before');
export const after = methodUse('after');
export const notify = methodUse('notify');
export const send = methodUse('send');
export const transition = methodUse('transition');

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
