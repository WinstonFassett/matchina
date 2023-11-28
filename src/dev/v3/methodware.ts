import { Middleware } from "../../extras/middleware";

export type Funcware<P extends any[], R> = Middleware<[params: P, result: R]>
const noop = () => {};


type FunctionType<T, K extends keyof T> = T[K] extends (...args: any[]) => any
  ? T[K]
  : never;


export function methodware<T, K extends keyof T, F extends FunctionType<T,K>>(
  target: T,
  methodName: K,
  middleware: Funcware<Parameters<F>, ReturnType<F>> //(inner: FunctionType<T, K>) => FunctionType<T, K>
) {
  const store = target as any;
  const original = store[methodName] as FunctionType<T, K>;
  store[methodName] = funcware(original.bind(target), middleware)  
  return () => {
    target[methodName] = original;
  };
}


const EMPTY = {}

export function funcware<P extends any[], R>(
  next: (...params: P) => R,
  middleware: Funcware<P, R>
) {
  return (...params: P) => {
    let result = EMPTY as R; 
    middleware([params, undefined as any], ([params, value]) => {
      // early return if value
      if (value !== EMPTY) return [params, value]
      return [params, next(...params)]
    });
    return result === EMPTY ? undefined : result;
  }  
}