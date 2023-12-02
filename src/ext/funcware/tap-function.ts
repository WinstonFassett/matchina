import { HasMethod, MethodOf } from "../methodware/extend-method";
import { Funcware } from "./funcware";

export function functionTap<K extends string, T extends HasMethod<K>>(
  fn: T[K],
): Funcware<MethodOf<HasMethod<K>, K>> {
  return (inner) =>
    (...params) => {
      const res = inner(...params);
      fn(...params);
      return res;
    };
}
