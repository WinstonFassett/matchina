import { HasMethod, MethodOf } from "../methodware/method-utility-types";
import { Funcware } from "../../function-types";

export const tap =
  <K extends string, T extends HasMethod<K>>(
    fn: T[K]
  ): Funcware<MethodOf<HasMethod<K>, K>> =>
  (inner) =>
  (...params) => {
    const res = inner(...params);
    fn(...params);
    return res;
  };
