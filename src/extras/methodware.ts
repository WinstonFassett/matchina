import { Func } from "../types";

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

export type MethodEnhancer<S, K extends keyof S> = S[K] extends (
  ...args: infer A
) => infer R
  ? (original: Method<S, K>, ...args: A) => R
  : S[K] extends (...args: infer A) => void
  ? (original: Method<S, K>, ...args: A) => void
  : never;

export type Method<S, K extends keyof S> = S[K] extends (
  ...args: infer A
) => infer R
  ? (...args: A) => R
  : S[K] extends (...args: any[]) => void
  ? (...args: any[]) => void
  : never;

export const methodwareEnhancer = <
  S,
  K extends keyof S,
  F extends S[K] extends (...args: any[]) => any ? S[K] : never = S[K] extends (
    ...args: any[]
  ) => any
    ? S[K]
    : never,
>(
  subject: S,
  method: K,
  enhancers: MethodEnhancer<S, K>[],
) => {
  return composeEnhancers<S, K, F>(enhancers);
};

/* 
  how should this work?
  enhancers are not called with results, but with orig func and args
  the first enhancer should be called with the original method and args
  the next enhancer should be called with the first enhancer and args
  the last enhancer should be called with the previous enhancer and args
  and the last enhancer should return the result
  so we don't use reduce with values, but we could use reduce to create a function chain
  */
function composeEnhancers<
  S,
  K extends keyof S,
  F extends S[K] extends (...args: any[]) => any ? S[K] : never = S[K] extends (
    ...args: any[]
  ) => any
    ? S[K]
    : never,
>(enhancers: MethodEnhancer<S, K>[]): MethodEnhancer<S, K> {
  let finalEnhancer: MethodEnhancer<S, K> = ((
    orig: F,
    ...args: Parameters<F>
  ) => {
    console.log("ORIG");
    return orig(...args);
  }) as MethodEnhancer<S, K>;
  let i = enhancers.length;
  const copy = [...enhancers].reverse();
  for (const enhancer of copy) {
    const id = i--;
    const nextEnhancer = finalEnhancer;
    finalEnhancer = ((innerMethod: Method<S, K>, ...args: Parameters<F>) => {
      console.log("enhancer", id);
      return enhancer(
        ((...args: Parameters<F>) =>
          nextEnhancer(innerMethod, ...args)) as Method<S, K>,
        ...args,
      ) as ReturnType<F>;
    }) as MethodEnhancer<S, K>;
  }
  return finalEnhancer;
  // return ((orig, ...args) => {
  //   console.log('final enhancer')
  //   return finalEnhancer?.(orig, ...args) ?? orig(...args)

  // }) as MethodEnhancer<S,K>
}

export const loggingEnhancer =
  (prefix = "") =>
  (originalMethod: Func, ...args: any[]) => {
    if (prefix.length > 0) {
      prefix = prefix + " ";
    }
    console.log(`${prefix}Calling method with args: ${JSON.stringify(args)}`);
    const result = originalMethod(...args);
    console.log(`${prefix}Method result: ${JSON.stringify(result)}`);
    return result;
  };
export const errorHandlingEnhancer = (originalMethod: Func, ...args: any[]) => {
  try {
    return originalMethod(...args);
  } catch (error: any) {
    console.log(`Error in method: ${error.message}`);
  }
};
export const timingEnhancer = (originalMethod: Func, ...args: any[]) => {
  console.log("timing enhancer", { originalMethod, args });
  const start = performance.now();
  const result = originalMethod(...args);
  console.log("OK");
  const end = performance.now();
  console.log(`Method execution time: ${end - start} milliseconds`);
  return result as ReturnType<typeof originalMethod>;
};

export const beforeAfterEnhancer = (before: Func) => {
  return (originalMethod: Func, ...args: any[]) => {
    const after = before(...args);
    const result = originalMethod(...args);
    after?.(result);
    return result;
  };
};

export const debounceEnhancer = (wait: number) => {
  let timeout: any;
  return <M extends Method<any, any>>(originalMethod: M, ...args: any[]) => {
    clearTimeout(timeout);
    let result: ReturnType<M>;
    timeout = setTimeout(() => {
      result = originalMethod(...args) as ReturnType<M>;
      console.log("debounce enhancer", { result });
    }, wait);
    return undefined as any;
  };
};
