import { Funcware, MethodOf, noop } from "../types";

export function extendMethod<T, K extends keyof T>(
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



export function extendMethod2<T, K extends keyof T>(
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

