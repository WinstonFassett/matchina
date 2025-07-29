export type FlatFilters<T> = {
  [K in keyof T]?: SingleValueFilter<T, K>;
};
export type SingleValueFilter<T, K extends keyof T> = T[K];

export type NestableFilters<T> = NestedFilter<T> & FlatFilters<T>;
export type NestedFilter<T> = {
  [K in keyof T]?: T[K] extends Record<string, any>
    ? NestableFilters<T[K]>
    : SingleValueFilter<T, K>;
};

export type FilterValues<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};

export type HasFilterValues<T, C> = T extends T
  ? {
      [K in keyof T & keyof C]: T[K] extends C[K] ? true : false;
    } extends Record<keyof C, true>
    ? T
    : never
  : never;
