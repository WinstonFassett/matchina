export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};

export function methodExtend<
  T,  
  K extends keyof T,
  M extends T[K] extends (...args: any[]) => any ? T[K] : never  
>(target: T, methodName: K, extend: (inner: M) => M) {
  const original = target[methodName] as M;
  target[methodName] = extend(original.bind(target));
  return () => {
    target[methodName] = original;
  };
}
export const methodUse =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: (inner: T[K]) => T[K]) =>
  (target: T) =>
    methodExtend(target, methodName, fn(target[methodName]));

export type ExitListener<P extends any[]> = (...params: P) => void;
export type EntryListener<P extends any[]> = (...params: P) => void | ExitListener<P>;
    

export const methodListenTo =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return methodUse(methodName)((...params) => {
      const res = target[methodName](...params);
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