import { Func } from "../../types";
import { functionTap } from "./functionTap";

export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};

export type MethodOf<T, K extends keyof T> = T[K] extends (...args: any[]) => any
  ? T[K]
  : never;

export type Funcware<F extends (...params: any[]) => any> = (
  inner: F,
) => F;
// type Methodware<T, K extends keyof T, M extends MethodOf<T, K> = MethodOf<T, K>> = 
//   Funcware<M>
  // (inner: MethodOf<T, K>) => MethodOf<T, K>;

export function methodExtend<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>
) {
  const original = target[methodName] as MethodOf<T, K>;
  target[methodName] = extend((original??noop).bind(target));
  return () => {
    target[methodName] = original;
  };
}

const noop = () => {};

export const methodUse =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(
    fn: Funcware<MethodOf<T,K>>
  ) =>
  (target: T) => {
    return methodExtend(target, methodName, fn);
  } 


export const methodTap =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return methodExtend(target, methodName, functionTap<K, T>(fn));
  };




  export function filtered<P extends any[], R, F extends Func<P, R>>(
    fn: (...params: Parameters<F>) => boolean
  ) {
    return (inner: F) => (...params: Parameters<F>) => {
      if (fn(...params)) return inner(...params)
    }
  }
  
  
  type Guardware<F extends (...args: any) => any> = (test: (...params: Parameters<F>) => boolean) => (inner: F) => F;

  export function guardware<E>(
    fn: (ev: E) => boolean
  ) {
    return (inner: (ev: E) => any) => (ev: E) => {
      if (fn(ev)) return inner(ev)
    }
  }
  
  
  export const whenware = <F extends (...params: any[]) => any>(
    test: (...params: Parameters<F>) => boolean | void,
    ware: Funcware<F>
  ) => {
    return (inner: F) => (...params: Parameters<F>) => {
      // console.log('whenware')
      if (test(...params)) { 
        // console.log('PASSED')
        return ware(inner)(...params);
      }
      // console.log('FAILED')
      return inner(...params);
    }
  };
