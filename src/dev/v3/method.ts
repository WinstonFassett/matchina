export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};

export function method<K extends string, T extends HasMethod<K> = HasMethod<K>>(
  methodName: K,
  target: T,
  fn: T[K],
) {
  const original = target[methodName];
  target[methodName] = fn as T[K];
  return () => {
    target[methodName] = original;
  };
}

export const methodUse =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) =>
    method(methodName, target, fn);

export function methodV2<
  K extends string,
  T extends HasMethod<K> = HasMethod<K>,
>(methodName: K, target: T, extend: (inner: T[K]) => T[K]) {
  const original = target[methodName];
  target[methodName] = extend(original.bind(target));
  return () => {
    target[methodName] = original;
  };
}
export const methodUseV2 =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: (inner: T[K]) => T[K]) =>
  (target: T) =>
    methodV2(methodName, target, fn(target[methodName]));

export const methodListen =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return methodUseV2(methodName)((...params) => {
      const res = target[methodName](...params);
      fn(...params);
      return res;
    })(target);
  };
