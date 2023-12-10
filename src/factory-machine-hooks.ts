import { AbortableEventHandler, setup } from "./ext";
import { EntryListener, ExitListener, when } from "./extras/when";
import { AnyFactoryState, AnyFactoryMachineEvent } from "./factory-machine";
import { after, before, guard, leave } from "./machine-hooks";
import { StateMachinery } from "./state-machine";
import { FactoryChangeEventFilter, FactoryChangeEventFromFilter, FilterValues, KeyedChangeEvent, KeyedChangeEventFilter, KeyedChangeEventFromFilter, isFactoryMachineEvent, isKeyedChangeEvent } from "./typeguards";
import { Effect } from "./types";


export const beforeEvent = <E extends AnyFactoryMachineEvent<any>, K extends E['type']>(
  type: K,
  fn: AbortableEventHandler<E & { type: K }>,
) => before<StateMachinery<E>>(
  (ev, abort) => {
    if (ev.type === type) {
      fn(ev as any, abort);
    }
  }
)
export const leftState = <E extends AnyFactoryMachineEvent<any>, K extends keyof E['machine']['states']>(stateKey: K, fn: EntryListener<E &{ from: AnyFactoryState<E['machine']['states'],K> }>) => when<E>(ev => ev.from.key === stateKey, fn)
export const enteredState = <E extends AnyFactoryMachineEvent<any>, K extends keyof E['machine']['states']>(stateKey: K, fn: EntryListener<E & { to: AnyFactoryState<E['machine']['states'],K> }>) => when<E>(ev => ev.from.key === stateKey, fn)
export const afterEvent = <E extends AnyFactoryMachineEvent<any>, K extends E['type']>(
  type: K,
  fn: Effect<E & { type: K }>,
) => after<StateMachinery<E>>(
  (ev) => {
    if (ev.type === type) {
      fn(ev as any);
    }
  }
)

export const onBeforeEvent = <E extends AnyFactoryMachineEvent<any>, K extends E['type']>(
  m: StateMachinery<E>,
  type: E['type'],
  fn: AbortableEventHandler<E & { type: E["type"]; }>,
) => setup(m)(
  beforeEvent(type, fn)
)

export const onLeftState = <E extends AnyFactoryMachineEvent<any>, K extends keyof E['machine']['states']>(
  m: StateMachinery<E>,
  stateKey: K, fn: ExitListener<E & { from: AnyFactoryState<E['machine']['states'],K> }>) => setup(m)(
  leave(leftState(stateKey, fn))
)

export const onAfterEvent = <E extends AnyFactoryMachineEvent<any>, K extends E['type']>(
  m: StateMachinery<E>,
  type: K,
  fn: Effect<E & { type: K; }>,
) => setup(m)(
  afterEvent<E,K>(type, fn)
)


export const onGuardEvent = <E extends AnyFactoryMachineEvent<any>, K extends E['type']>(
  m: StateMachinery<E>,
  type: K,
  fn: StateMachinery<E & { type: K }>['guard'],
) => setup(m)(
  guard((ev) => {
    if (ev.type === type) {
      return fn(ev as any)
    }
    return true
  })
)

export const whenEvent = <
  E extends AnyFactoryMachineEvent<any>, 
  F extends FactoryChangeEventFilter<E>,
>(
  filter: F,
  fn: Effect<E & FactoryChangeEventFromFilter<E,F>>,
) => when<E>(
  (ev) => isFactoryMachineEvent(ev, filter),
  fn as any
) 

