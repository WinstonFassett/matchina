type Listener<T> = (value: T) => void;
export type Subscriber<T> = (listener: Listener<T>) => () => void;
export type Emitter<T> = (value: T) => void;

export function nanosubscriber<T>(): [Subscriber<T>, Emitter<T>] {
  let listeners = [] as Listener<T>[];
  function subscribe(listener: Listener<T>) {
    listeners.push(listener);
    return function unsubscribe() {
      listeners = listeners.filter((l) => l !== listener);
    };
  }
  function emit(value: T) {
    for (const listener of listeners) {
      listener(value);
    }
  }
  return [subscribe, emit];
}
