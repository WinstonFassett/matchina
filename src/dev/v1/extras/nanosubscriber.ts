export type Listen<T> = (value: T) => void;
export type Subscribe<T> = (listener: Listen<T>) => Unsubscribe;
export type Unsubscribe = () => void;
export type Emit<T> = (value: T) => void;

export function nanosubscriber<T>(): [Subscribe<T>, Emit<T>, Listen<T>[]] {
  let listeners = [] as Listen<T>[];
  return [
    function subscribe(listener: Listen<T>) {
      listeners.push(listener);
      return function unsubscribe() {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    function emit(value: T) {
      for (const listener of listeners) {
        listener(value);
      }
    },
    listeners,
  ];
}
