import { MethodEnhancer, wrapMethod } from "./wrap-method";

export const onTransition = <
  M extends {
    transition: any;
  },
>(
  machine: M,
  customFn: MethodEnhancer<M, "transition">,
) => {
  return wrapMethod(machine, "transition", customFn);
};
