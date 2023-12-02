import { Funcware } from "./Funcware";
import { methodExtend } from "./methodExtend";
import { HasMethod } from "./methodExtend";
import { MethodOf } from "./methodExtend";


export const methodUse = <K extends string>(methodName: K) => <T extends HasMethod<K>>(
  fn: Funcware<MethodOf<T, K>>
) => (target: T) => {
  return methodExtend(target, methodName, fn);
};
