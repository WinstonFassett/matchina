import { createStoreMachine, StoreChange } from "./store-machine";
import { withSubscribe } from "./extras/with-subscribe";

/**
 * Atom - A simple single value store with get/set/update/subscribe.
 * Composed from createStoreMachine + withSubscribe.
 * Inspired by nanostores, designed for internal machine data.
 *
 * @example
 * ```ts
 * const count = atom(0);
 * count.get(); // 0
 * count.set(5);
 * count.update(n => n + 1);
 * const unsub = count.subscribe(val => console.log(val));
 * ```
 */
export interface Atom<T> {
  get(): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
  subscribe(listener: (change: StoreChange<T>) => void): () => void;
  getState(): T;
  getChange(): StoreChange<T>;
}

export function atom<T>(initialValue: T): Atom<T> {
  const store = createStoreMachine<T>(initialValue, {
    set: (value: T) => () => value,
    update: (fn: (current: T) => T) => (change) => fn(change.from),
  });

  const enhanced = withSubscribe(store);

  return {
    get: () => store.getState(),
    set: (value: T) => store.dispatch("set", value),
    update: (fn: (current: T) => T) => store.dispatch("update", fn),
    subscribe: enhanced.subscribe,
    getState: () => store.getState(),
    getChange: () => store.getChange(),
  };
}
