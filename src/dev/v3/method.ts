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
type Methodware<T, K extends keyof T, M extends MethodOf<T, K> = MethodOf<T, K>> = 
  Funcware<M>
  // (inner: MethodOf<T, K>) => MethodOf<T, K>;

export function methodExtend<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Methodware<T, K>
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
    return methodUse(methodName)(functionTap<K, T>(fn))(target);
  };


