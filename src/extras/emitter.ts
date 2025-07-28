import { Disposer, Effect } from "../function-types";

type Listen<T> = Effect<T>;

/**
 * Subscribes a listener to receive emitted values.
 *
 * @group Interfaces
 * @param listener - Function to call with each emitted value.
 * @returns Unsubscribe function to remove the listener.
 */
export type Subscribe<T> = (listener: Listen<T>) => Unsubscribe;

type Unsubscribe = Disposer;
type Emit<T> = Effect<T>;

/**
 * Creates a minimal pub/sub system for values of type T.
 *
 * Usage:
 *   const [subscribe, emit] = emitter<number>();
 *   const unsub = subscribe((v) => console.log(v));
 *   emit(42); // logs 42
 *   unsub(); // removes listener
 *
 * @param listeners - Optional initial array of listeners.
 * @returns [subscribe, emit, listeners]
 */
export const emitter = <T>(
  listeners = [] as Listen<T>[]
): [Subscribe<T>, Emit<T>, Listen<T>[]] => [
  (listener: Listen<T>) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  (value: T) => {
    for (const listener of listeners) {
      listener(value);
    }
  },
  listeners,
];
