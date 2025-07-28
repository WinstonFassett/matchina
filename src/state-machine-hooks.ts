import { createMethodEnhancer, enhanceMethod, setup } from "./ext";
import { HasMethod, MethodOf } from "./ext/methodware/method-utility-types";
import { Setup } from "./function-types";
import { matchChange } from "./match-change";
import { ChangeEventKeyFilter } from "./match-change-types";
import { HasFilterValues } from "./match-filter-types";
import { StateMachine, TransitionEvent } from "./state-machine";
import { Adapters, HookAdapters } from "./state-machine-hook-adapters";


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

