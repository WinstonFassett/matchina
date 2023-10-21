type Method<A extends any[], R> = (...args: A) => R;
export type MethodEnhancer<S, K extends keyof S> = S[K] extends (
  ...args: infer A
) => infer R
  ? (original: Method<A, R>, ...args: A) => R
  : never;
export function wrapMethod<S, K extends keyof S>(
  subject: S,
  name: K,
  fn: MethodEnhancer<S, K>,
) {
  const original = subject[name];
  const originalMethod = subject[name] as unknown as Method<any[], any>;
  const boundOriginal = originalMethod.bind(subject);
  subject[name] = function (...args: any[]) {
    // console.log('call', name, args)
    return fn.call(subject, boundOriginal, ...args);
  } as any;
  return () => {
    subject[name] = original;
  };
}
