import { nanosubscriber } from "../../../extras/nanosubscriber";
import { StateMachine } from "../machine-types";
import {
  KeyedChangeEventFilter,
  KeyedChangeEventFromFilter,
  isKeyedChangeEvent,
} from "../typeguards";
import { onUpdate } from "./on-update";

export function withSubscribe<M extends StateMachine<any, any>>(machine: M) {
  type Event = ReturnType<M["getChange"]>;
  const [subscribe, emit] = nanosubscriber<Event>();
  // machine.update((previous) => previous);
  const dispose = onUpdate(machine, ((commit: any, updater: any) => {
    const current = machine.getChange() as Event;
    commit(updater);
    const change = machine.getChange() as Event;
    if (change && change !== current) {
      emit(change);
    }
  }) as any);
  return Object.assign(machine, {
    subscribe,
    when: subscribeKey,
    dispose,
  });

  type Subscriber<
    E extends Event,
    F extends KeyedChangeEventFilter<E> = KeyedChangeEventFilter<E>,
  > = (event: E & KeyedChangeEventFromFilter<F>) => void | (() => void);

  function subscribeKey<
    E extends Event,
    F extends KeyedChangeEventFilter<E> = KeyedChangeEventFilter<E>,
  >(filter: F, subscriber: Subscriber<E, F>) {
    let exitListener: void | (() => void);
    return subscribe((event) => {
      if (isKeyedChangeEvent(filter, event)) {
        exitListener?.();
        exitListener = subscriber(event as any);
      }
    });
  }
}

// // usage test
// const states = defineStates({
//   Idle: {},
//   Running: {},
// });

// const inner = defineMachine(states, {
//   Idle: {
//     start: states.Running,
//   },
//   Running: {
//     stop: states.Idle,
//   },
// }).create(states.Idle())
// const machine = withSubscribe(inner);
