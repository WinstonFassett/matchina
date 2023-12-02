// #region General

export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
export type CreateFunc<T, P = any> = (...args: P[]) => T;
export type SwapFunc<T> = (updater: (event: T) => T) => void;


