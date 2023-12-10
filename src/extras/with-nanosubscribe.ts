import { StateMachinery } from "../state-machine";
import { nanosubscriber } from "./nanosubscriber";

export function withNanoSubscribe<T extends StateMachinery<any>>(
  target: T & Partial<{ subscribe: any }>,
) {
  if (target.subscribe) {
    return target as T & { subscribe: typeof subscribe };
  }
  const [subscribe, emit, listeners] =
    nanosubscriber<Parameters<T["notify"]>[0]>();
  const notify = target.notify;
  target.notify = (ev) => {
    notify(ev);
    emit(ev);
  };
  return Object.assign(target, {
    subscribe,
    emit,
    listeners,
  }); // as T & { subscribe: typeof subscribe };
}
