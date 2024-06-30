export type FlatFilters<T> = { [K in keyof T]?: SingleValueFilter<T, K> };
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

export function matchFilters<
  T extends Record<string, any>,
  C extends NestableFilters<T>,
>(item: T, condition: C): item is T & HasFilterValues<T, C> {
  return Object.keys(condition).every((key) =>
    matchKey(condition[key as keyof C], item[key]),
  );
}

export function asFilterMatch<
  T extends Record<string, any>,
  C extends NestableFilters<T>,
>(item: T, condition: C): T & HasFilterValues<T, C> {
  if (matchFilters(item, condition)) {
    return item;
  }
  throw new Error("not a match");
}

export function matchKey<T>(keyOrKeys: T | T[] | undefined, value: T) {
  if (keyOrKeys === undefined) {
    return true;
  }
  return Array.isArray(keyOrKeys)
    ? keyOrKeys.includes(value)
    : keyOrKeys === value;
}
