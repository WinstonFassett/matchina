import { methodExtend } from "./methodExtend";
import { functionTap } from "./functionTap";
import { HasMethod } from "./methodExtend";



export const methodTap = <K extends string>(methodName: K) => <T extends HasMethod<K>>(fn: T[K]) => (target: T) => {
  return methodExtend(target, methodName, functionTap<K, T>(fn));
};
