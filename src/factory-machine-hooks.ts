// import { setup } from "./ext";
// import { AbortableEventHandler } from "./ext/abortable-event-handler";
// import { iff } from "./extras/iff";
import { when } from "./extras/when";
import { EntryListener, ExitListener } from "./extras/entry-exit-types";
import { FactoryMachineEvent } from "./factory-machine-types";
import { FactoryState } from "./factory-state";
// import { matchChange } from "./match-change";
// import { ChangeEventKeyFilter } from "./match-change-types";
// import { FilterValues, HasFilterValues } from "./match-filter-types";
// import { StateMachine } from "./state-machine";
// import { after, before, enter, guard, leave } from "./state-machine-hooks";
// import { Effect } from "./function-types";

// export const beforeEvent = <
//   E extends FactoryMachineEvent<any>,
//   K extends E["type"],
// >(
//   type: K,
//   fn: AbortableEventHandler<E & { type: K }>
// ) =>
//   before<StateMachine<E>>((ev, abort) => {
//     if (ev.type === type) {
//       fn(ev as any, abort);
//     }
//   });

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
 *   whenFromState("Idle", handleLeaveIdle),
 * );
 * @source Useful for running logic when leaving a specific state in a state machine.
 */
export const whenFromState = <
  E extends FactoryMachineEvent<any>,
  K extends E["from"]["key"],
>(
  stateKey: K,
  fn: EntryListener<E & { from: FactoryState<E["machine"]["states"], K> }>
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
  fn: EntryListener<E & { to: FactoryState<E["machine"]["states"], K> }>
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
