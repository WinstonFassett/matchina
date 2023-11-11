import { exit } from "node:process";
import {
  ChangeEventFromKey,
  ChangeEventToKey,
  ChangeEventType,
} from "../../playground/typeguard.usage";
import { defineMachine } from "../machine";
import { StateMachine } from "../machine-types";
import { defineStates } from "../states";
import { nanosubscriber } from "./nanosubscriber";
import { onUpdate } from "./on-update";
import {
  ChangeEventFilter,
  KeyedChangeEvent,
  isKeyedChangeEvent,
} from "./typeguards";

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
    Type extends ChangeEventType<E>,
    FromKey extends ChangeEventFromKey<E>,
    ToKey extends ChangeEventToKey<E>,
  > = (
    event: E & KeyedChangeEvent<Type, FromKey, ToKey>,
  ) => void | (() => void);

  function subscribeKey<
    E extends Event,
    Type extends ChangeEventType<E>,
    ToKey extends ChangeEventToKey<E>,
    FromKey extends ChangeEventFromKey<E>,
  >(
    filter: ChangeEventFilter<Type, ToKey, FromKey>,
    subscriber: Subscriber<E, Type, FromKey, ToKey>,
  ) {
    let exitListener: void | (() => void);
    return subscribe((event) => {
      if (isKeyedChangeEvent(event, filter)) {
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
