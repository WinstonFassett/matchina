import { Adapters } from "./state-machine-hook-adapter-types";
import {
  enhanceMethod,
  methodEnhancer,
  setup,
} from "./ext";
import { Funcware, Middleware, Setup } from "./function-types";
import { matchChange } from "./match-change";
import { ChangeEventKeyFilter } from "./match-change-types";
import { HasFilterValues } from "./match-filter-types";
import { StateMachine } from "./state-machine";
import { StateMachineEvent } from "./state-machine";
import { HookAdapters } from "./state-machine-hook-adapters";
import { HasMethod, MethodOf } from "./ext/methodware/method-utility-types";

const machineHook =
  <K extends string & keyof Adapters>(key: K) =>
  <T extends HasMethod<K>>(machine: T, fn: MethodOf<T, K>) =>
    methodEnhancer<K>(key)(HookAdapters[key](fn))(machine);

const hookSetup =
  <K extends string & keyof Adapters>(key: K) =>
  <T extends HasMethod<K>>(
    ...config: Parameters<Adapters<Parameters<MethodOf<T, K>>[0]>[K]>
  ) =>
    methodEnhancer<K>(key)(HookAdapters[key](...config)) as (
      target: T
    ) => () => void;

export const composeHandlers =
  <E extends StateMachineEvent>(
    outer: (value: E) => E | undefined,
    inner: (value: E) => E | undefined
  ): ((value: E) => E | undefined) =>
  (ev) =>
    outer(inner(ev) as any);

export const combineGuards =
  <E extends StateMachineEvent>(
    first: (value: E) => boolean,
    next: (value: E) => boolean
  ): ((value: E) => boolean) =>
  (ev) => {
    const res = first(ev) && next(ev);
    return res;
  };

// #region Interceptors
// export const send = methodHook("send");
export const before = hookSetup("before");
export const transition = hookSetup("transition");
export const resolveExit = hookSetup("resolveExit");
export const guard = hookSetup("guard");
export const update = hookSetup("update");
export const handle = hookSetup("handle");
// #endregion

// #region Effects
export const effect = hookSetup("effect");
export const leave = hookSetup("leave");
export const enter = hookSetup("enter");
export const after = hookSetup("after");
export const notify = hookSetup("notify");
// #endregion

export const onBefore = machineHook("before");
export const onTransition = machineHook("transition");
export const onResolveExit = machineHook("resolveExit");
export const onGuard = machineHook("guard");
export const onUpdate = machineHook("update");
export const onHandle = machineHook("handle");
export const onEffect = machineHook("effect");
export const onLeave = machineHook("leave");
export const onEnter = machineHook("enter");
export const onAfter = machineHook("after");
export const onNotify = machineHook("notify");

export const change = <
  E extends StateMachineEvent,
  F extends ChangeEventKeyFilter<E>,
  FE extends E & HasFilterValues<E, F>,
>(
  filter: F,
  ...setups: Setup<StateMachine<HasFilterValues<E, F>>>[]
) => {
  return (machine: StateMachine<E>) => {
    return enhanceMethod(machine, "transition", (next) => (ev) => {
      const unsetup = matchChange(ev, filter)
        ? setup(machine as unknown as StateMachine<FE>)(...setups)
        : undefined;
      const result = next(ev);
      unsetup?.();
      return result;
    });
  };
};

export const setupTransition = <
  E extends StateMachineEvent,
  F extends ChangeEventKeyFilter<E>,
>(
  machine: StateMachine<E>,
  filter: F,
  ...setups: Setup<StateMachine<HasFilterValues<E, F>>>[]
) => change(filter, ...setups)(machine);

export function middlewareToFuncware<E>(
  middleware: Middleware<E>
): Funcware<(change: E) => void> {
  return (next) => (ev) => {
    middleware(ev, next);
  };
}
