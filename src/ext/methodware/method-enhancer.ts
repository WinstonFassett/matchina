import { Funcware } from "../../function-types";
import { MethodOf, enhanceMethod } from "./enhance-method";

export const methodEnhancer =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: Funcware<MethodOf<T, K>>) =>
  (target: T) => {
    return enhanceMethod(target, methodName, fn);
  };
  
export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};
