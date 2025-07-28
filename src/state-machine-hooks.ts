import { enhanceMethod, createMethodEnhancer, setup } from "./ext";
import { Funcware, Middleware, Setup } from "./function-types";
import { matchChange } from "./match-change";
import { ChangeEventKeyFilter } from "./match-change-types";
import { HasFilterValues } from "./match-filter-types";
import { StateMachine, TransitionEvent } from "./state-machine";
import { Adapters, HookAdapters } from "./state-machine-hook-adapters";
import { HasMethod, MethodOf } from "./ext/methodware/method-utility-types";


const hookSetup =
  <K extends string & keyof Adapters>(key: K) =>
  <T extends HasMethod<K>>(
    ...config: Parameters<Adapters<Parameters<MethodOf<T, K>>[0]>[K]>
  ) =>
    createMethodEnhancer<K>(key)(HookAdapters[key](...config)) as (
      target: T
    ) => () => void;

export const composeHandlers =
  <E extends TransitionEvent>(
    outer: (value: E) => E | undefined,
    inner: (value: E) => E | undefined
  ): ((value: E) => E | undefined) =>
  (ev) =>
    outer(inner(ev) as any);

export const combineGuards =
  <E extends TransitionEvent>(
    first: (value: E) => boolean,
    next: (value: E) => boolean
  ): ((value: E) => boolean) =>
  (ev) => {
    const res = first(ev) && next(ev);
    return res;
  };

// #region Interceptors
/**
 * @function before
 * Enhances the state machine's `before` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.before}.
 *
 * Usage: `setup(machine)(before(ev => {}))`
 */
export const before = hookSetup("before");
/**
 * @function transition
 * Enhances the state machine's `transition` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.transition}.
 *
 * Usage: `setup(machine)(transition(middleware))`
 */
export const transition = hookSetup("transition");
/**
 * @function resolveExit
 * Enhances the state machine's `resolveExit` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.resolveExit}.
 *
 * Usage: `setup(machine)(resolveExit(fn))`
 */
export const resolveExit = hookSetup("resolveExit");
/**
 * @function guard
 * Enhances the state machine's `guard` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.guard}.
 *
 * Usage: `setup(machine)(guard(fn))`
 */
export const guard = hookSetup("guard");
/**
 * @function update
 * Enhances the state machine's `update` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.update}.
 *
 * Usage: `setup(machine)(update(fn))`
 */
export const update = hookSetup("update");
/**
 * @function handle
 * Enhances the state machine's `handle` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.handle}.
 *
 * Usage: `setup(machine)(handle(fn))`
 */
export const handle = hookSetup("handle");
// #endregion

// #region Effects
/**
 * @function effect
 * Enhances the state machine's `effect` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.effect}.
 *
 * Usage: `setup(machine)(effect(fn))`
 */
export const effect = hookSetup("effect");
/**
 * @function leave
 * Enhances the state machine's `leave` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.leave}.
 *
 * Usage: `setup(machine)(leave(fn))`
 */
export const leave = hookSetup("leave");
/**
 * @function enter
 * Enhances the state machine's `enter` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.enter}.
 *
 * Usage: `setup(machine)(enter(fn))`
 */
export const enter = hookSetup("enter");
/**
 * @function after
 * Enhances the state machine's `after` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.after}.
 *
 * Usage: `setup(machine)(after(fn))`
 */
export const after = hookSetup("after");
/**
 * @function notify
 * Enhances the state machine's `notify` lifecycle method.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.notify}.
 *
 * Usage: `setup(machine)(notify(fn))`
 */
export const notify = hookSetup("notify");
// #endregion


// const machineHook =
//   <K extends string & keyof Adapters>(key: K) =>
//   <T extends HasMethod<K>>(machine: T, fn: MethodOf<T, K>) =>
//     methodEnhancer<K>(key)(HookAdapters[key](fn))(machine);
// export const onBefore = machineHook("before");
// export const onTransition = machineHook("transition");
// export const onResolveExit = machineHook("resolveExit");
// export const onGuard = machineHook("guard");
// export const onUpdate = machineHook("update");
// export const onHandle = machineHook("handle");
// export const onEffect = machineHook("effect");
// export const onLeave = machineHook("leave");
// export const onEnter = machineHook("enter");
// export const onAfter = machineHook("after");
// export const onNotify = machineHook("notify");

export const change = <
  E extends TransitionEvent,
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
  E extends TransitionEvent,
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
