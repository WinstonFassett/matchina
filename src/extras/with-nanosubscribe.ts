import { StateMachinery } from "../state-machine";
import { Subscribe, nanosubscriber } from "./nanosubscriber";

export const withNanoSubscribe = <
  T extends StateMachinery<any>,
  E extends Parameters<T["notify"]>[0],
>(
  target: T & Partial<{ subscribe: Subscribe<E> }>,
) => {
  if (!target.subscribe) {
    const [subscribe, emit, listeners] =
      nanosubscriber<Parameters<T["notify"]>[0]>();
    const notify = target.notify.bind(target);
    target.notify = (ev) => {
      notify(ev);
      emit(ev);
    };
    target.subscribe = subscribe;
  }
  return target as T & { subscribe: typeof target.subscribe };
};
