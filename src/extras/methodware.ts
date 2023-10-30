import { MethodEnhancer, wrapMethod } from "./wrap-method";

type Method<P,T> = (...args: any[]) => T;

export function wrapMethodWithMiddlewares<S, K extends keyof S>(
  subject: S,
  name: K,
  middlewares: MethodEnhancer<S, K>[]
): () => void {
  let restoreFunctions: Array<() => void> = [];

  let currentMethod = subject[name] as unknown as Method<any[], any>;

  for (const middleware of middlewares) {
    const current = currentMethod;
    restoreFunctions.push(
      wrapMethod(subject, name, (orig, ...args) => {
        return middleware(orig, ...args)
      })
    );
    currentMethod = subject[name] as unknown as Method<any[], any>;
  }

  return () => {
    for (const restore of restoreFunctions.reverse()) {
      restore?.();
    }
  };
}