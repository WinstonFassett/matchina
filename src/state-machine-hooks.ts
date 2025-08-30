import { createMethodEnhancer } from "./ext";
import type { HasMethod, MethodOf } from ".";
import { DisposeFunc } from "./function-types";
import type { Funcware } from "./function-types";
import { Adapters, HookAdapters } from "./state-machine-hook-adapters";

/**
 * Creates a lifecycle hook enhancer for a given StateMachine method key.
 * Returns a function that applies the hook and provides a disposer to remove it.
 *
 * Usage:
 * ```ts
 * hookSetup("before")(config)(machine)
 * ```
 */
type FirstArg<F> = F extends (arg: infer A, ...args: any[]) => any ? A : never;
// Use the first parameter type of the method directly. Do not widen.
type AdapterEvent<F> = FirstArg<F>;

export const hookSetup =
  <K extends string & keyof Adapters>(key: K) =>
  <T extends HasMethod<K>>(
    ...config: Parameters<Adapters<AdapterEvent<MethodOf<T, K>>>[K]>
  ) =>
    ((target: T) => {
      const adapter = HookAdapters[key](...config) as unknown as Funcware<MethodOf<T, K>>;
      return createMethodEnhancer<K>(key)(adapter)(target);
    }) as (target: T) => DisposeFunc;

/**
 * Composes two event handler functions for a state machine lifecycle method.
 * The inner handler runs first, then the outer handler receives its result.
 *
 * Usage:
 * ```ts
 * composeHandlers(outer, inner)(event)
 * ```
 */
export const composeHandlers =
  <E>(
    outer: (value: E) => E | undefined,
    inner: (value: E) => E | undefined
  ): ((value: E) => E | undefined) =>
  (ev) => outer(inner(ev) as any);

/**
 * Combines two guard functions for a state machine transition.
 * Both guards must return true for the transition to proceed.
 *
 * Usage:
 * ```ts
 * combineGuards(first, next)(event)
 * ```
 */
export const combineGuards =
  <E>(
    first: (value: E) => boolean,
    next: (value: E) => boolean
  ): ((value: E) => boolean) =>
  (ev) => first(ev) && next(ev);

// #region Interceptors
/**
 * @function before
 * Enhances the `before` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.before}.
 *
 * Usage:
 * ```ts
 * setup(machine)(before(ev => {}))
 * ```
 */
export const before = hookSetup("before");
/**
 * @function transition
 * Enhances the `transition` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.transition}.
 *
 * Usage:
 * ```ts
 * setup(machine)(transition(middleware))
 * ```
 */
export const transition = hookSetup("transition");
/**
 * @function resolveExit
 * Enhances the `resolveExit` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.resolveExit}.
 *
 * Usage:
 * ```ts
 * setup(machine)(resolveExit(fn))
 * ```
 */
export const resolveExit = hookSetup("resolveExit");
/**
 * @function guard
 * Enhances the `guard` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.guard}.
 *
 * Usage:
 * ```ts
 * setup(machine)(guard(fn))
 * ```
 */
export const guard = hookSetup("guard");
/**
 * @function update
 * Enhances the `update` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.update}.
 *
 * Usage:
 * ```ts
 * setup(machine)(update(fn))
 * ```
 */
export const update = hookSetup("update");
/**
 * @function handle
 * Enhances the `handle` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.handle}.
 *
 * Usage:
 * ```ts
 * setup(machine)(handle(fn))
 * ```
 */
export const handle = hookSetup("handle");
// #endregion

// #region Effects
/**
 * @function effect
 * Enhances the `effect` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.effect}.
 *
 * Usage:
 * ```ts
 * setup(machine)(effect(fn))
 * ```
 */
export const effect = hookSetup("effect");
/**
 * @function leave
 * Enhances the `leave` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.leave}.
 *
 * Usage:
 * ```ts
 * setup(machine)(leave(fn))
 * ```
 */
export const leave = hookSetup("leave");
/**
 * @function enter
 * Enhances the `enter` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.enter}.
 *
 * Usage:
 * ```ts
 * setup(machine)(enter(fn))
 * ```
 */
export const enter = hookSetup("enter");
/**
 * @function after
 * Enhances the `after` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.after}.
 *
 * Usage:
 * ```ts
 * setup(machine)(after(fn))
 * ```
 */
export const after = hookSetup("after");
/**
 * @function notify
 * Enhances the `notify` lifecycle method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.notify}.
 *
 * Usage:
 * ```ts
 * setup(machine)(notify(fn))
 * ```
 */
export const notify = hookSetup("notify");


/** * @function send
 * Enhances the `send` method of a {@link StateMachine}.
 * Returns a disposer to undo the enhancement.
 * See {@link StateMachine.send}.
 *
 * Usage:
 * ```ts
 * setup(machine)(send(
 *   (innerSend) => (type, ...params) => {
 *     // custom logic
 *     return innerSend(type, ...params);
 *   }
 * ))
 * ```
 */
export const send = hookSetup("send");