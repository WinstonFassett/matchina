import { Funcware } from "../funcware/funcware";
import { extendMethod } from "./extend-method";
import { HasMethod } from "./extend-method";
import { MethodOf } from "./extend-method";


export const methodExtender = <K extends string>(methodName: K) => <T extends HasMethod<K>>(
  fn: Funcware<MethodOf<T, K>>
) => (target: T) => {
  return extendMethod(target, methodName, fn);
};
