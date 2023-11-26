import {
  HasMethod,
  filteredMethodListenTo,
  methodListenTo,
  methodUse
} from "./method";
import { setup } from "./setup";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

//#region interceptors
export const send = methodUse("send");
export const transition = methodUse("transition");
// export const guard = <T extends HasMethod<"guard">>(fn: T["guard"]) =>
//   methodUse("guard")((inner) => (...params) => {
//     return inner(...params) && fn(inner)(...params);
//   });

export const guard = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["guard"],
) => methodUse("guard")<StateMachinery<E>>((inner) => (ev) => {
  return inner(ev) && fn(ev)
});

export const handle = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["handle"],
) => methodUse("handle")<StateMachinery<E>>((inner) => (ev) => fn(inner(ev)));
//#endregion

//#region effects
export const effect = methodListenTo("effect");
export const before = methodListenTo("before");
export const after = methodListenTo("after");
export const notify = methodListenTo("notify");
//#endregion

// export const methodUse =
//   <K extends string>(methodName: K) =>
//   <T extends HasMethod<K>>(fn: (inner: T[K]) => T[K]) =>
//   (target: T) =>
//     methodExtend(methodName, target, fn(target[methodName]));

function whenEventSetup () {
  return function forMachine(machine) {
    // map over
  }
}

export const when =
  <
    E extends ChangeCommandEvent,
  >(    
    test: (ev: E) => boolean,
    enterListener: (ev: E) => void | ((ev: E) => void),
  ) => (target: HasMethod<'before'> & HasMethod<'after'>) =>  {
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
