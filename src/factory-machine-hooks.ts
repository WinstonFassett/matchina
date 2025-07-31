// import { setup } from "./ext";
// import { AbortableEventHandler } from "./ext/abortable-event-handler";
// import { iff } from "./extras/iff";
import { createDisposer } from "./ext";
import { EntryListener } from "./extras/entry-exit-types";
import { when } from "./extras/when";
import {
  HookKey,
  TransitionHookExtensions,
} from "./factory-machine-lifecycle-types";
import {
  FactoryMachine,
  FactoryMachineContext,
  FactoryMachineEvent,
} from "./factory-machine-types";
import { FactoryKeyedState } from "./state-keyed";
import { matchChange } from "./match-change";
import { ChangeEventKeyFilter } from "./match-change-types";
import { hookSetup } from "./state-machine-hooks";

type TransitionHookConfig<
  FC extends FactoryMachineContext = FactoryMachineContext,
> = Partial<ChangeEventKeyFilter<FactoryMachineEvent<FC>>> &
  Partial<{
    [K in HookKey]: TransitionHookExtensions<FactoryMachineEvent<FC>>[K];
  }>;

/**
 * Registers one or more transition hooks for a {@link FactoryMachine}.
 * Each config can specify matching criteria (`from`, `to`, `type`) and any lifecycle hook(s).
 * Returns a setup function for the machine.
 * Usage:
 * ```ts
 * setup(machine)(
 *   transitionHook({
 *     from: "Idle",
 *     type: "start",
 *     to: "Running",
 *     // optional hook functions
 *     transition: transitionFn,
 *     guard: guardFn,
 *     resolveExit: resolveExitFn,
 *     before: beforeFn,
 *     handle: handleFn,
 *     update: updateFn,
 *     leave: leaveFn,
 *     enter: enterFn,
 *     effect: effectFn,
 *     notify: notifyFn,
 *     after: afterFn,
 *   }),
 *   // omit `from`, `to`, `type` to match all transitions
 *   transitionHook({
 *     effect: globalFn,
 *     // more hooks...
 *   }),
 * ```
 * @source This is the recommended flat API for lifecycle hooks in Matchina. It allows you to declaratively register hooks for specific transitions and phases.
 */
export function transitionHook<FC extends FactoryMachineContext>(
  config: TransitionHookConfig<FC>
) {
  const { from, to, type, ...hooks } = config;
  const filter = { from, to, type } as ChangeEventKeyFilter<
    FactoryMachineEvent<FC>
  >;
  return (machine: any) => {
    return createDisposer(
      Object.entries(hooks).map(([hookKey, fn]) => {
        return hookSetup(hookKey)((ev: FactoryMachineEvent<FC>) => {
          if (matchChange(ev, filter)) {
            return fn(ev);
          }
          return ev;
        })(machine);
      })
    );
  };
}

/**
 * Registers multiple transition hooks for a {@link FactoryMachine}.
 * Returns a setup function for the machine.
 *
 * Usage:
 * ```ts
 * setup(machine)(
 *   transitionHooks(
 *     { 
 *       // optional event filters
 *       from: "Idle", type: "start", to: "Running", 
 *         // optional hook functions
 *         transition: transitionFn,
 *         guard: guardFn,
 *         resolveExit: resolveExitFn,
 *         before: beforeFn,
 *         handle: handleFn,
 *         update: updateFn,
 *         leave: leaveFn,
 *         enter: enterFn,
 *         effect: effectFn,
 *         notify: notifyFn,
 *         after: afterFn,
 *     },
 *     // omit `from`, `to`, `type` to match all transitions
 *     { effect: globalFn, ...moreHooks },
 *     ...moreConditions
 *   )
 * )
 * ```
 * @source Use this to compose multiple transition hooks in a single setup call.
 */
export function transitionHooks<FC extends FactoryMachineContext>(
  ...entries: TransitionHookConfig<FC>[]
) {
  return (machine: FactoryMachine<FC>) => {
    return createDisposer(
      entries.flatMap((entry) => {
        return transitionHook<FC>(entry)(machine);
      })
    );
  };
}

/**
 * Creates an entry listener that triggers when the event's `from.key` matches the given state key.
 *
 * @template E - FactoryMachineEvent type
 * @template K - State key type
 * @param stateKey - The state key to match against `from.key`
 * @param fn - EntryListener to invoke when matched
 * @returns An entry listener for the specified state key
 * @example
 * setup(machine)(
 *   effect(whenFromState("Idle", handleLeaveIdle)),
 * );
 * @source Useful for running logic when leaving a specific state in a state machine.
 */
export const whenFromState = <
  E extends FactoryMachineEvent<any>,
  K extends E["from"]["key"],
>(
  stateKey: K,
  fn: EntryListener<E & { from: FactoryKeyedState<E["machine"]["states"], K> }>
) => when<E>((ev) => ev.from.key === stateKey, fn);

/**
 * Creates an entry listener that triggers when the event's `to.key` matches the given state key.
 *
 * @template E - FactoryMachineEvent type
 * @template K - State key type
 * @param stateKey - The state key to match against `to.key`
 * @param fn - EntryListener to invoke when matched
 * @returns An entry listener for the specified state key
 * @example
 * setup(machine)(
 *   whenState("Active", handleEnterActive),
 * );
 * @source Useful for running logic when entering a specific state in a state machine.
 */
export const whenState = <
  E extends FactoryMachineEvent<any>,
  K extends keyof E["machine"]["states"],
>(
  stateKey: K,
  fn: EntryListener<E & { to: FactoryKeyedState<E["machine"]["states"], K> }>
) => when<E>((ev) => ev.to.key === stateKey, fn);

/**
 * Creates an entry listener that triggers when the event's type matches the given event type.
 *
 * @template E - FactoryMachineEvent type
 * @template K - Event type
 * @param type - The event type to match
 * @param fn - EntryListener to invoke when matched
 * @returns An entry listener for the specified event type
 * @example
 * setup(machine)(
 *   whenEventType("activate", handleActivate),
 * );
 * @source Useful for running logic when a specific event type is triggered in a state machine.
 */
export const whenEventType = <
  E extends FactoryMachineEvent<any>,
  K extends E["type"],
>(
  type: K,
  fn: EntryListener<E & { type: K }>
) => when<E>((ev) => ev.type === type, fn as any);

// export const afterEvent = <
//   E extends FactoryMachineEvent<any>,
//   K extends E["type"],
// >(
//   type: K,
//   fn: Effect<E & { type: K }>
// ) =>
//   after<StateMachine<E>>((ev) => {
//     if (ev.type === type) {
//       fn(ev as any);
//     }
//   });

// export const onBeforeEvent = <E extends FactoryMachineEvent<any>>(
//   m: StateMachine<E>,
//   type: E["type"],
//   fn: AbortableEventHandler<E & { type: E["type"] }>
// ) => setup(m)(beforeEvent(type, fn));

// export const onLeftState = <
//   E extends FactoryMachineEvent<any>,
//   K extends keyof E["machine"]["states"],
// >(
//   m: StateMachine<E>,
//   stateKey: K,
//   fn: ExitListener<E & { from: FactoryState<E["machine"]["states"], K> }>
// ) => setup(m)(leave(whenFromState(stateKey, fn)));

// export const onEnteredState = <
//   E extends FactoryMachineEvent<any>,
//   K extends keyof E["machine"]["states"],
// >(
//   m: StateMachine<E>,
//   stateKey: K,
//   fn: ExitListener<E & { from: FactoryState<E["machine"]["states"], K> }>
// ) => setup(m)(enter(whenState(stateKey, fn)));

// export const onAfterEvent = <
//   E extends FactoryMachineEvent<any>,
//   K extends E["type"],
// >(
//   m: StateMachine<E>,
//   type: K,
//   fn: Effect<E & { type: K }>
// ) => setup(m)(afterEvent<E, K>(type, fn));

// export const onGuardEvent = <
//   E extends FactoryMachineEvent<any>,
//   K extends E["type"],
// >(
//   m: StateMachine<E>,
//   type: K,
//   fn: StateMachine<E & { type: K }>["guard"]
// ) =>
//   setup(m)(
//     guard((ev) => {
//       if (ev.type === type) {
//         return fn(ev as any);
//       }
//       return true;
//     })
//   );

// export const whenEvent = <
//   E extends FactoryMachineEvent<any>,
//   F extends ChangeEventKeyFilter<E> = ChangeEventKeyFilter<E>,
//   FV extends FilterValues<F> = FilterValues<F>,
// >(
//   filter: F,
//   fn: (
//     ev: E &
//       HasFilterValues<
//         E,
//         {
//           type: FV["type"];
//           to: { key: FV["to"] };
//           from: { key: FV["from"] };
//         }
//       >
//   ) => any
// ) => when<E>((ev) => matchChange(ev, filter), fn as any);

// export const iffEvent = <
//   E extends FactoryMachineEvent<any>,
//   F extends ChangeEventKeyFilter<E> = ChangeEventKeyFilter<E>,
//   FV extends FilterValues<F> = FilterValues<F>,
// >(
//   filter: F,
//   fn: (
//     ev: E &
//       HasFilterValues<
//         E,
//         {
//           type: FV["type"];
//           to: { key: FV["to"] };
//           from: { key: FV["from"] };
//         }
//       >
//   ) => any
// ) => iff((ev) => matchChange(ev, filter), fn);
