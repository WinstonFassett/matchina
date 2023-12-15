import { AbortableEventHandler, setup } from "./ext";
import { EntryListener, ExitListener, when } from "./extras/when";
import {
  AnyFactoryMachineEvent,
  AnyFactoryMachineTransition,
  AnyFactoryState,
} from "./factory-machine";
import { after, before, guard, leave } from "./machine-hooks";
import { StateMachine } from "./state-machine";
import {
  FactoryChangeEventFromFilter,
  matchesChangeEventKeys,
} from "./typeguards";
import { Effect } from "./types";

export const beforeEvent = <
  E extends AnyFactoryMachineEvent<any>,
  K extends E["type"],
>(
  type: K,
  fn: AbortableEventHandler<E & { type: K }>,
) =>
  before<StateMachine<E>>((ev, abort) => {
    if (ev.type === type) {
      fn(ev as any, abort);
    }
  });
export const leftState = <
  E extends AnyFactoryMachineEvent<any>,
  K extends keyof E["machine"]["states"],
>(
  stateKey: K,
  fn: EntryListener<E & { from: AnyFactoryState<E["machine"]["states"], K> }>,
) => when<E>((ev) => ev.from.key === stateKey, fn);
export const enteredState = <
  E extends AnyFactoryMachineEvent<any>,
  K extends keyof E["machine"]["states"],
>(
  stateKey: K,
  fn: EntryListener<E & { to: AnyFactoryState<E["machine"]["states"], K> }>,
) => when<E>((ev) => ev.from.key === stateKey, fn);
export const afterEvent = <
  E extends AnyFactoryMachineEvent<any>,
  K extends E["type"],
>(
  type: K,
  fn: Effect<E & { type: K }>,
) =>
  after<StateMachine<E>>((ev) => {
    if (ev.type === type) {
      fn(ev as any);
    }
  });

export const onBeforeEvent = <
  E extends AnyFactoryMachineEvent<any>,
  K extends E["type"],
>(
  m: StateMachine<E>,
  type: E["type"],
  fn: AbortableEventHandler<E & { type: E["type"] }>,
) => setup(m)(beforeEvent(type, fn));

export const onLeftState = <
  E extends AnyFactoryMachineEvent<any>,
  K extends keyof E["machine"]["states"],
>(
  m: StateMachine<E>,
  stateKey: K,
  fn: ExitListener<E & { from: AnyFactoryState<E["machine"]["states"], K> }>,
) => setup(m)(leave(leftState(stateKey, fn)));

export const onAfterEvent = <
  E extends AnyFactoryMachineEvent<any>,
  K extends E["type"],
>(
  m: StateMachine<E>,
  type: K,
  fn: Effect<E & { type: K }>,
) => setup(m)(afterEvent<E, K>(type, fn));

export const onGuardEvent = <
  E extends AnyFactoryMachineEvent<any>,
  K extends E["type"],
>(
  m: StateMachine<E>,
  type: K,
  fn: StateMachine<E & { type: K }>["guard"],
) =>
  setup(m)(
    guard((ev) => {
      if (ev.type === type) {
        return fn(ev as any);
      }
      return true;
    }),
  );

export const whenEvent = <
  E extends AnyFactoryMachineEvent<any>,
  FromKey extends string & E["from"]["key"],
  Type extends string &
    E["type"] &
    AnyFactoryMachineTransition<E["machine"], FromKey>["type"],
  ToKey extends string &
    E["to"]["key"] &
    AnyFactoryMachineTransition<E["machine"], FromKey, Type>["to"]["key"],
>(
  filter: {
    from?: FromKey | FromKey[];
    type?: Type | Type[];
    to?: ToKey | ToKey[];
  },
  fn: Effect<
    E &
      FactoryChangeEventFromFilter<
        E,
        {
          from: FromKey;
          type: Type;
          to: ToKey;
        }
      >
  >,
) =>
  when<E>(
    (ev) =>
      matchesChangeEventKeys<
        E,
        // FV['from'], FV['type'], FV['to']
        FromKey,
        Type,
        ToKey
      >(ev, filter as any),
    fn as any,
  );
