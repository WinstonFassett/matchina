// type Methodware<T, K extends keyof T, M extends MethodOf<T, K> = MethodOf<T, K>> =
//   Funcware<M>

import { Funcware } from "../funcware/funcware";

// (inner: MethodOf<T, K>) => MethodOf<T, K>;
export function extendMethod<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>,
) {
  const original = target[methodName] as MethodOf<T, K>;
  target[methodName] = extend((original ?? noop).bind(target));
  return () => {
    target[methodName] = original;
  };
}
export type MethodOf<T, K extends keyof T> = T[K] extends (
  ...args: any[]
) => any
  ? T[K]
  : never;
export const noop = () => {};
export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};
