export type Func<A = any, R = any> = (...args: A[]) => R;

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

// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = DrainOuterGeneric<
  {
    [K in keyof T]: T[K];
  } & object
>;
export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;


type FunctionWithParameters<F> = F extends (...args: infer Args) => any
  ? Args extends []
    ? false
    : true
  : false;
  
export type KeysWithZeroArgs<T> = {
  [K in keyof T]: FunctionWithParameters<T[K]> extends true ? never : K;
}[keyof T];