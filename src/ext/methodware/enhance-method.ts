import { Funcware } from "../../function-types";
import { MethodOf } from "./method-utility-types";

const noop = () => {};

export function enhanceMethod<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>
) {
  const original = target[methodName] as MethodOf<T, K>;
  target[methodName] = extend(((original ?? (noop as T)) as any).bind(target));
  return () => {
    target[methodName] = original;
  };
}
