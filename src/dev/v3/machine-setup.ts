import {
  HasMethod,
  methodListen,
  methodUse
} from "./method";
import { setup } from "./setup";
import { AnyStateMachinery, StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

//#region interceptors
export const send = methodUse("send");
export const transition = methodUse("transition");
export const guard = <T extends HasMethod<"guard">>(fn: T["guard"]) =>
  methodUse("guard")((inner) => (...params) => {
    return inner(...params) && fn(inner)(...params);
  });
export const handle = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["handle"],
) => methodUse("handle")<StateMachinery<E>>((inner) => (ev) => fn(inner(ev)));
//#endregion

//#region effects
export const effect = methodListen("effect");
export const before = methodListen("before");
export const after = methodListen("after");
export const notify = methodListen("notify");
//#endregion

// export const methodUse =
//   <K extends string>(methodName: K) =>
//   <T extends HasMethod<K>>(fn: (inner: T[K]) => T[K]) =>
//   (target: T) =>
//     methodExtend(methodName, target, fn(target[methodName]));


export const when =
  <
    E extends ChangeCommandEvent,
    T extends StateMachinery<E> = StateMachinery<E>,    
  >(
    target: T,
    test: (ev: E) => boolean,
    enterListener: (ev: E) => (ev: E) => void,
  ) =>
  () => {
    let exitListener: void | ((ev: E) => void);
    const unbefore = before((ev) => {
      if (test(ev)) return; // not an exit(?)
      exitListener?.(ev);
      exitListener = undefined;
    })(target);
    const unafter = after((ev) => {
      if (test(ev)) exitListener = enterListener(ev);
    })(target);
    return () => {
      unbefore();
      unafter();
    };
  };

// These are pretty generic, could be named so
export function machineSetup<M>(...extenders: ((machine: M) => () => void)[]) {
  return function setupMachine(machine: M) {
    return setup(...extenders.map((fn) => fn(machine)));
  };
}

export function setupMachine<M>(machine: M) {
  return function (...extenders: ((machine: M) => () => void)[]) {
    return setup(...extenders.map((fn) => fn(machine)));
  };
}
