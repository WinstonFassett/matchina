type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};
export function use<K extends string, T extends HasMethod<K> = HasMethod<K>>(methodName: K, target: T, fn: T[K]) {
  const original = target[methodName];
  target[methodName] = (fn) as T[K];
  return () => {
    target[methodName] = original;
  };
}


export const useOn = <K extends string>(methodName: K) => <T extends HasMethod<K>>(target: T, fn: T[K]) => use(methodName, target, fn);
