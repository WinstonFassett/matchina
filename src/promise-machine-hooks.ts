import { createMethodEnhancer } from "./ext";

export function guardExecute<F extends (...args: any[]) => any>(
  guardFn: (...args: Parameters<F>) => boolean
) {
  return createMethodEnhancer("execute")((fn) => (...args) => {
    if (!guardFn(...(args as any))) {
      throw new Error("Guard condition failed");
    }
    return fn(...args);
  });
}
