import { Funcware } from "../../function-types";
import { enhanceMethod } from "./enhance-method";
import { MethodOf, HasMethod } from "./method-utility-types";

export const methodEnhancer =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: Funcware<MethodOf<T, K>>) =>
  (target: T) => {
    return enhanceMethod(target, methodName, fn);
  };
