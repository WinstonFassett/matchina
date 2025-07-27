import { Funcware } from "../../function-types";

const noop = () => {};

export function enhanceMethod<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>,
) {
  const original = target[methodName] as MethodOf<T, K>;
  target[methodName] = extend(((original ?? (noop as T)) as any).bind(target));
  return () => {
    target[methodName] = original;
  };
}
export type MethodOf<T, K extends keyof T> = T[K] extends (
  ...args: any[]
) => any
  ? T[K]
  : never;
