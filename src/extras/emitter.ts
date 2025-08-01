import { EffectFunc, SetupFunc } from "../function-types";

/**
 * @interface
 * Subscribes a listener ({@link EffectFunc}) to receive emitted values.
 *
 * Returned by {@link emitter}.
 *
 * @group Interfaces
 * @param listener - Function to call with each emitted value.
 * @returns Unsubscribe function to remove the listener.
 */
export type SubscribeFunc<T> = SetupFunc<EffectFunc<T>>;

/**
 * Creates a minimal pub/sub system for values of type T.
 *
 * Usage:
 * ```ts
 *   const [subscribe, emit] = emitter<number>();
 *   const unsub = subscribe((v) => console.log(v));
 *   emit(42); // logs 42
 *   unsub(); // removes listener
 * ```
 * @param listeners - Optional initial array of listeners.
 * @returns [subscribe, emit, listeners]
 */
export const emitter = <T>(
  listeners = [] as EffectFunc<T>[]
): [SubscribeFunc<T>, EffectFunc<T>, EffectFunc<T>[]] => [
  (listener: EffectFunc<T>) => {
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
