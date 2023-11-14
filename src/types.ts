// #region General
export type Func<A = any, R = any> = (...args: A[]) => R;

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

// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = DrainOuterGeneric<{ [K in keyof T]: T[K] } & {}>;
export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;


export type RemainingProperties<Required, Present, Match = any> = Pick<
  Required,
  Exclude<keyof Required, keyof Present> &
    (Match extends any
      ? {
          [K in keyof Required]: Required[K] extends Match ? K : never;
        }[keyof Required]
      : never)
>;
