import { AbortableEventHandler, setup } from "./ext";
import { iff } from "./extras/iff";
import { EntryListener, ExitListener, when } from "./extras/when";
import { FactoryMachineEvent, FactoryState } from "./factory-machine";
import { ChangeEventKeyFilter, matchChange } from "./match-change";
import { FilterValues, HasFilterValues } from "./match-filters";
import { StateMachine } from "./state-machine";
import { after, before, enter, guard, leave } from "./state-machine-hooks";
import { Effect } from "./types";

export const beforeEvent = <
  E extends FactoryMachineEvent<any>,
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
export const whenFromState = <
  E extends FactoryMachineEvent<any>,
  K extends E["from"]["key"],
>(
  stateKey: K,
  fn: EntryListener<E & { from: FactoryState<E["machine"]["states"], K> }>,
) => when<E>((ev) => ev.from.key === stateKey, fn);

export const whenState = <
  E extends FactoryMachineEvent<any>,
  K extends keyof E["machine"]["states"],
>(
  stateKey: K,
  fn: EntryListener<E & { to: FactoryState<E["machine"]["states"], K> }>,
) => when<E>((ev) => ev.to.key === stateKey, fn);


export const whenEventType = <
  E extends FactoryMachineEvent<any>,
  K extends E["type"],
>(
  type: K,
  fn: EntryListener<E & { type: K }>,
) => when<E>((ev) => ev.type === type, fn as any);


export const afterEvent = <
  E extends FactoryMachineEvent<any>,
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
  E extends FactoryMachineEvent<any>,
  K extends E["type"],
>(
  m: StateMachine<E>,
  type: E["type"],
  fn: AbortableEventHandler<E & { type: E["type"] }>,
) => setup(m)(beforeEvent(type, fn));

export const onLeftState = <
  E extends FactoryMachineEvent<any>,
  K extends keyof E["machine"]["states"],
>(
  m: StateMachine<E>,
  stateKey: K,
  fn: ExitListener<E & { from: FactoryState<E["machine"]["states"], K> }>,
) => setup(m)(leave(whenFromState(stateKey, fn)));

export const onEnteredState = <
  E extends FactoryMachineEvent<any>,
  K extends keyof E["machine"]["states"],
>(
  m: StateMachine<E>,
  stateKey: K,
  fn: ExitListener<E & { from: FactoryState<E["machine"]["states"], K> }>,
) => setup(m)(enter(whenState(stateKey, fn)));

export const onAfterEvent = <
  E extends FactoryMachineEvent<any>,
  K extends E["type"],
>(
  m: StateMachine<E>,
  type: K,
  fn: Effect<E & { type: K }>,
) => setup(m)(afterEvent<E, K>(type, fn));

export const onGuardEvent = <
  E extends FactoryMachineEvent<any>,
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
  E extends FactoryMachineEvent<any>,
  F extends ChangeEventKeyFilter<E> = ChangeEventKeyFilter<E>,
  FV extends FilterValues<F> = FilterValues<F>,
>(
  filter: F,
  fn: (ev: 
    E &
      HasFilterValues<
        E,
        {
          type: FV["type"];
          to: { key: FV["to"] };
          from: { key: FV["from"] };
        }
      >
  ) => any,
) => when<E>((ev) => matchChange(ev, filter), fn as any);

export const iffEvent = <
  E extends FactoryMachineEvent<any>,
  F extends ChangeEventKeyFilter<E> = ChangeEventKeyFilter<E>,
  FV extends FilterValues<F> = FilterValues<F>,
>(
  filter: F,
  fn: (ev: 
    E &
      HasFilterValues<
        E,
        {
          type: FV["type"];
          to: { key: FV["to"] };
          from: { key: FV["from"] };
        }
      >
  ) => any,
) => iff(ev => matchChange(ev, filter), fn)