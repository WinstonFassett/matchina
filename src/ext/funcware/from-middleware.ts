import { Middleware, Funcware } from "../../function-types";

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
// export const change = <
//   E extends TransitionEvent,
//   F extends ChangeEventKeyFilter<E>,
//   FE extends E & HasFilterValues<E, F>,
// >(
//   filter: F,
//   ...setups: Setup<StateMachine<HasFilterValues<E, F>>>[]
// ) => {
//   return (machine: StateMachine<E>) => {
//     return enhanceMethod(machine, "transition", (next) => (ev) => {
//       const unsetup = matchChange(ev, filter)
//         ? setup(machine as unknown as StateMachine<FE>)(...setups)
//         : undefined;
//       const result = next(ev);
//       unsetup?.();
//       return result;
//     });
//   };
// };
// export const setupTransition = <
//   E extends TransitionEvent,
//   F extends ChangeEventKeyFilter<E>,
// >(
//   machine: StateMachine<E>,
//   filter: F,
//   ...setups: Setup<StateMachine<HasFilterValues<E, F>>>[]
// ) => change(filter, ...setups)(machine);

/**
 * Converts a classic middleware function into funcware (middleware for functional composition).
 *
 * Use cases:
 * - Adapting middleware patterns to funcware-based systems
 * - Composing event handlers or state machine transitions with middleware logic
 *
 * @template E - The event or change type handled by the middleware
 * @param middleware - A classic middleware function accepting (event, next)
 * @returns A funcware function that wraps the next handler with the middleware logic
 * @source This function is useful for integrating traditional middleware patterns into systems
 * that use functional composition (funcware), such as state machines, event-driven architectures,
 * or custom handler pipelines. It allows you to reuse existing middleware logic in a more composable way.
 */
export function funcwareFromMiddleware<E>(
  middleware: Middleware<E>
): Funcware<(change: E) => void> {
  return (next) => (ev) => {
    middleware(ev, next);
  };
}
