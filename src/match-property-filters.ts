export type Filters<T> = 
| { [K in keyof T]?: SingleValueFilter<T, K> } 
| { [K in UnionKeys<T>]?: AnyValueFilter<T, K> } 
;

type UnionKeys<T> = T extends T ? keyof T : never;
type UnionValues<T, K extends keyof any> = T extends T ? (K extends keyof T ? T[K] : never) : never;
type SingleValueFilter<T, K extends keyof T> = T[K];
type AnyValueFilter<T, K extends keyof T> = Array<UnionValues<T, K>> | ReadonlyArray<UnionValues<T, K>>;


export type HasFilterValues<T, C> = T extends T
  ? {
      [K in keyof T & keyof C]: 
        C[K] extends ReadonlyArray<infer U>
          ? T[K] extends U 
            ? true 
            : false
          : T[K] extends C[K] 
            ? true 
            : false
    } extends Record<keyof C, true>
      ? T
      : never
  : never;



export function matchesPropertyFilters<T, C extends Filters<T>>(
  item: T,
  condition: C
): item is T & HasFilterValues<T, C> {
  return Object.keys(condition).every(key => matchKey(condition[key as keyof C], item[key as any]));
}

function matchKey<T>(keyOrKeys: T | T[] | undefined, value: T) {
  if (keyOrKeys === undefined) {
    return true;
  }
  return Array.isArray(keyOrKeys)
    ? keyOrKeys.includes(value)
    : keyOrKeys === value;
}