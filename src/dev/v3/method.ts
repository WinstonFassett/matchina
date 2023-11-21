type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};
export function method<K extends string, T extends HasMethod<K> = HasMethod<K>>(methodName: K, target: T, fn: T[K]) {
  const original = target[methodName];
  target[methodName] = (fn) as T[K];
  return () => {
    target[methodName] = original;
  };
}

export const methodUse =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) => (target: T) =>
    method(methodName, target, fn); 