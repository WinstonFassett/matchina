export function ensureProperty<
  T,
  F extends (...args: any) => any = (...args: any) => any,
  K extends string = string,
  O extends { [key in K]: ReturnType<F> } = { [key in K]: ReturnType<F> },
>(target: T, key: K, fn: F) {
  const enhanced = target as T & O;
  enhanced[key] = enhanced[key] ?? fn(target);
  return enhanced;
}
