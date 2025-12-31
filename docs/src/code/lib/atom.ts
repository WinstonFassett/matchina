/**
 * Atom - A dead simple single value store with get/set/update/subscribe.
 * Inspired by nanostores, designed for internal machine data.
 */
export interface Atom<T> {
  get(): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
  subscribe(listener: (value: T, prev: T) => void): () => void;
}

export function atom<T>(initialValue: T): Atom<T> {
  let value = initialValue;
  const listeners = new Set<(value: T, prev: T) => void>();

  return {
    get: () => value,
    set: (next: T) => {
      const prev = value;
      value = next;
      listeners.forEach(fn => fn(value, prev));
    },
    update: (fn: (current: T) => T) => {
      const prev = value;
      value = fn(value);
      listeners.forEach(fn => fn(value, prev));
    },
    subscribe: (listener: (value: T, prev: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
