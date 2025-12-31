/**
 * Atom - A dead simple single value store with get/set/update/subscribe.
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

/**
 * Creates an atom with a React-friendly API.
 * Includes a notify method for triggering re-renders.
 */
export function reactiveAtom<T>(initialValue: T): Atom<T> & { notify(): void } {
  const base = atom(initialValue);
  return {
    ...base,
    notify: () => {
      const current = base.get();
      // Trigger listeners without changing value
      base.set(current);
    },
  };
}
