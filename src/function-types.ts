export type Disposer = () => void;
export type Setup<T> = (target: T) => Disposer;

export type Effect<E> = (ev: E) => void;
export type Middleware<E> = (event: E, next: (event: E) => void) => void;

export type Func<A = any, R = any> = (...args: A[]) => R;
export type Funcware<F extends (...params: any[]) => any> = (inner: F) => F;
