import { AbortableEventHandler, setup } from "./ext";
import { EntryListener, ExitListener, when } from "./extras/when";
import { AnyFactoryState, FactoryMachineEvent } from "./factory-machine";
import { after, before, leave } from "./machine-hooks";
import { StateMachinery } from "./state-machine";
import { Effect } from "./types";


const leftState = <E extends FactoryMachineEvent<any>, K extends keyof E['machine']['states']>(stateKey: K, fn: EntryListener<{ from: AnyFactoryState<E['machine']['states'],K> }>) => when<E>(ev => ev.from.key === stateKey, fn)
const enteredState = <E extends FactoryMachineEvent<any>, K extends keyof E['machine']['states']>(stateKey: K, fn: EntryListener<{ to: AnyFactoryState<E['machine']['states'],K> }>) => when<E>(ev => ev.from.key === stateKey, fn)

const onLeftState = <E extends FactoryMachineEvent<any>, K extends keyof E['machine']['states']>(
  m: StateMachinery<E>,
  stateKey: K, fn: ExitListener<{ from: AnyFactoryState<E['machine']['states'],K> }>) => setup(m)(
  leave(leftState(stateKey, fn))
)

const beforeEvent = <E extends FactoryMachineEvent<any>, K extends E['type']>(
  type: K,
  fn: AbortableEventHandler<E & { type: K }>,
) => before<StateMachinery<E>>(
  (ev, abort) => {
    if (ev.type === type) {
      fn(ev as any, abort);
    }
  }
)

const afterEvent = <E extends FactoryMachineEvent<any>, K extends E['type']>(
  type: K,
  fn: Effect<E & { type: K }>,
) => after<StateMachinery<E>>(
  (ev) => {
    if (ev.type === type) {
      fn(ev as any);
    }
  }
)
