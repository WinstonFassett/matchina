import type { StateMachine } from "../state-machine";
import { Subscribe, emitter } from "./emitter";

export const withSubscribe = <
  T extends Pick<StateMachine<any>, "notify">,
  E extends Parameters<T["notify"]>[0],
>(
  target: T & Partial<{ subscribe: Subscribe<E> }>
) => {
  if (!target.subscribe) {
    const notify = target.notify.bind(target);
    const [subscribe, emit] = emitter<Parameters<T["notify"]>[0]>();
    target.notify = (ev) => {
      notify(ev);
      emit(ev);
    };
    target.subscribe = subscribe;
  }
  return target as T & { subscribe: typeof target.subscribe };
};
