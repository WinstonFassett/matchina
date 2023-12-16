
export type FlatFilters<T> =  { 
  [K in keyof T]?: SingleValueFilter<T, K> 
};


type SingleValueFilter<T, K extends keyof T> = T[K];

type NestedFilter<T> = { [K in keyof T]?: T[K] extends Record<string, any> ? NestableFilters<T[K]> : (SingleValueFilter<T, K>) }; 

export type NestableFilters<T> = NestedFilter<T> & FlatFilters<T>;

export type FilterValues<F> = {
  [K in keyof F]: F[K] extends (infer U)[] ? U : F[K];
};

export type HasFilterValues<T, F> = T extends T
  ? {
      [K in keyof T & keyof F]: 
        T[K] extends F[K] 
          ? true 
          : false
    } extends Record<keyof F, true>
      ? T
      : never
  : never;


export function matchesPropertyFilters<T extends Record<string, any>, C extends NestableFilters<T>>(
  item: T,
  condition: C
): item is T & HasFilterValues<T, C> {
  return Object.keys(condition).every((key) => matchKey(condition[key as keyof C], (item)[key]));
}

export function asPropertyFilterMatch<T extends Record<string, any>, C extends NestableFilters<T>>(
  item: T,
  condition: C
): T & HasFilterValues<T, C> {
  if (matchesPropertyFilters(item, condition)) {
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


