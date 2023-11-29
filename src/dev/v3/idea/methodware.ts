import { Middleware } from "../../../extras/middleware";

export type Funcware<P extends any[], R> = Middleware<[params: P, result: R]>

const noop = () => {};

type FunctionType<T, K extends keyof T> = T[K] extends (...args: any[]) => any
  ? T[K]
  : never;

const Methodware = Symbol('Methodware')

export function methodware<T, K extends keyof T, F extends FunctionType<T,K>>(
  target: T,
  methodName: K,
  middleware: Funcware<Parameters<F>, ReturnType<F>>
) {
  const store = target as any;
  const original = store[methodName] as FunctionType<T, K>;
  store[methodName] = funcware(
    original[Methodware] ? original : original.bind(target), 
    middleware
  )
  store[methodName][Methodware] = true
  return () => {
    target[methodName] = original;
  };
}

const VOID = {}

type Func<P extends any[], R> = (...params: P) => R;

export function funcware<P extends any[], R>(
  fn: Func<P, R>,
  middleware: Funcware<P, R>
) {
  return (...params: P) => {
    let result = VOID as R; 
    middleware([params, undefined as any], ([params, value]) => {            
      result = fn(...params)
    });
    if (result !== VOID) return result;
  }
}

type Transform<E> = (ev: E) => E;

export function transformware<E>(
  fn: Transform<E>,
  middleware: Middleware<E>
) {
  return (ev: E) => {
    let result = VOID as E; 
    middleware(ev, (ev) => {            
      result = fn(ev)
    });
    if (result !== VOID) return result;
  }
}
