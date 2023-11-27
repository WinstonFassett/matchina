export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};

type FunctionType<T, K extends keyof T> = T[K] extends (...args: any[]) => any
  ? T[K]
  : never;

export function addUnique<T extends Record<string,any>,K extends string,V>(target: T, k:K, fn: (target: T) => V): T & { [key: K]: V }{
  const store = target as any;
  if (store[k]) return store[k];
  store[k] = fn(target);
  
}

export function methodExtend<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: (inner: FunctionType<T, K>) => FunctionType<T, K>
) {
  const original = target[methodName] as FunctionType<T, K>;
  target[methodName] = extend((original??noop).bind(target));
  return () => {
    target[methodName] = original;
  };
}

const noop = () => {};

export const methodUse =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(
    fn: (inner: FunctionType<T, K>) => FunctionType<T, K>
  ) =>
  (target: T) => {
    return methodExtend(target, methodName, fn);
  } 


export type ExitListener<P extends any[]> = (...params: P) => void;
export type EntryListener<P extends any[]> = (...params: P) => void | ExitListener<P>;
    

export const methodListenTo =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return methodUse(methodName)(inner => (...params) => {
      const res = inner(...params);
      fn(...params);
      return res;
    })(target);
  };

export function condition<E>(
    test: (ev: E)=>boolean,     
    entryListener: EntryListener<[E]>
  ) {
    let exitListener: void | ((ev: E)=>void);
    return (ev: E) => {
      if (test(ev)) {
        exitListener = entryListener(ev);
      } else {
        exitListener?.(ev);
        exitListener = undefined;
      }
    }
  }