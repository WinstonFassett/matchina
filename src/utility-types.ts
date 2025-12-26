export type Members<T> = T[keyof T];

export type MemberReturnType<
  F extends {
    [key: keyof any]: (...args: any[]) => any;
  },
  K extends keyof F,
> = ReturnType<F[K]>;

// Uses `string &` constraint to prevent key type explosion
export type FlatMemberUnion<T> = {
  [StateKey in string & keyof T]: T[StateKey];
}[string & keyof T];

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

export type KeysWithZeroRequiredArgs<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => any
    ? Args extends [] | [undefined?]
      ? K
      : never
    : never;
}[keyof T];
