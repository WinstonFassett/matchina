import { Middleware } from "../../extras/middleware";

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

export function funcware<P extends any[], R>(
  fn: (...params: P) => R,
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
