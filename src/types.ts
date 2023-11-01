// #region General

export type AnyStateKey = keyof any;
export type AnyEventKey = keyof any;
export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
export type AnyFunction = (...args: any[]) => unknown;
export type Func<A extends any[], R> = (...args: A) => R;
export type ArgsType<F extends Func<any, any>> = Parameters<F>;
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

export type Simplify<T> = DrainOuterGeneric<{ [K in keyof T]: T[K] } & {}>

export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never

export type ExtractColumnType<DB, TB extends keyof DB, C> =
  // Inline version of DrainOuterGeneric for performance reasons.
  // Don't replace with DrainOuterGeneric!
  [DB] extends [unknown]
    ? {
        [T in TB]: C extends keyof DB[T] ? DB[T][C] : never
      }[TB]
    : never
export type DictionaryValues<Type> = Type[keyof Type];


// export type Head<Type extends AnyArray> = Type["length"] extends 0 ? never : Type[0];

export type NonNever<Type extends {}> = Pick<
  Type,
  { [Key in keyof Type]: Type[Key] extends never ? never : Key }[keyof Type]
>;

export type KeysOfUnion<ObjectType> = ObjectType extends unknown
	? keyof ObjectType
	: never;

// #endregion

