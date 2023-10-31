export type MethodEnhancer<S, K extends keyof S> = S[K] extends (
  ...args: infer A
) => infer R
  ? (original: Method<S, K>, ...args: A) => R
  : never;

type Method<S, K extends keyof S> = S[K] extends (...args: infer A) => infer R
  ? (...args: A) => R
  : never;

export function wrapMethod<S, K extends keyof S>(
  subject: S,
  name: K,
  fn: MethodEnhancer<S, K>,
) {
  const original = subject[name];
  const originalMethod = subject[name] as unknown as Method<S, K>;
  const boundOriginal = originalMethod.bind(subject);
  subject[name] = function (...args: any[]) {
    return fn.call(subject, boundOriginal as any, ...args);
  } as any;
  return () => {
    subject[name] = original;
  };
}

export function methodware<S, K extends keyof S>(
  subject: S,
  name: K,
  enhancers: MethodEnhancer<S, K>[],
): () => void {
  const restoreFunctions: Array<() => void> = [];
  for (const enhance of enhancers) {
    restoreFunctions.push(wrapMethod(subject, name, enhance));
  }
  return () => {
    for (const restore of restoreFunctions.reverse()) {
      restore?.();
    }
  };
}
