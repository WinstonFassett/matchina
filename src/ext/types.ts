export type Setup<T> = (target: T) => Disposer;
export type Disposer = () => void;

export const noop = () => {};

export type Funcware<F extends (...params: any[]) => any> = (inner: F) => F;

export type AbortableEventHandler<E> = (event: E, abort: () => void) => void;

export type MethodOf<T, K extends keyof T> = T[K] extends (
  ...args: any[]
) => any
  ? T[K]
  : never;

export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};
