// #region General

export type AnyStateKey = keyof any;
export type AnyEventKey = keyof any;
export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
export type CreateFunc<T, P = any> = (...args: P[]) => T;
export type SwapFunc<T> = (updater: (event: T) => T) => void;

// #endregion

// #region Utility

export type Members<T> = T[keyof T];

export type MemberReturnType<
  F extends {
    [key: keyof any]: (...args: any[]) => any;
  },
  K extends keyof F,
> = ReturnType<F[K]>;

export type FlatMemberUnion<T> = {
  [StateKey in keyof T]: T[StateKey];
}[keyof T];

export type TUnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;

export type FlatMemberUnionToIntersection<T> = TUnionToIntersection<
  FlatMemberUnion<T>
>;

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// #endregion
