import { MethodEnhancer, wrapMethod } from "./wrap-method";

export function onUpdate<
  M extends Record<string, any> & {
    update: (...args: any[]) => any;
  },
>(machine: M, customFn: MethodEnhancer<M, "update">) {
  return wrapMethod(machine, "update", customFn);
}
