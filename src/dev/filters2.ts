
// type UnionKeys<T> = T extends T ? keyof T : never;

// type Filters<T> = {
//     [P in UnionKeys<T>]?: T extends Record<P, infer V> ? V | Array<V> : never;
// };

// export type Filters<T> = object & {
//   [K in keyof T]?: T[K] 
// };
//| Array<T[K]>;

// export type Filters<T> = {
//   [K in keyof T]?: T[K] | Array<Extract<T[K], any>>;
// };

// export type Filters<T> = {
//   [K in keyof T]?: T[K] | ReadonlyArray<T[K]> | T[K][];
// };

// type UnionToIntersection<U> = 
//     (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// export type AllowedValues<T, K extends keyof any> = UnionToIntersection<T extends any ? (K extends keyof T ? T[K] : never) : never>;

// export type Filters<T> = {
//     [K in keyof UnionToIntersection<T>]?: AllowedValues<T, K> | Array<AllowedValues<T, K>> | ReadonlyArray<AllowedValues<T, K>>;
// };

// export type Filters<T> = {
//   [K in keyof T]?: T[K] | T[K][] | ReadonlyArray<T[K]>;
// };


type UnionKeys<T> = T extends T ? keyof T : never;
type UnionValues<T, K extends keyof any> = T extends T ? (K extends keyof T ? T[K] : never) : never;

type SingleFilter<T, K extends keyof T> = T[K];
type ArrayFilter<T, K extends keyof T> = Array<UnionValues<T, K>> | ReadonlyArray<UnionValues<T, K>>;

export type Filters<T> = 
| {
  [K in keyof T]?: SingleFilter<T, K>;
} 
| {
    [K in UnionKeys<T>]?: ArrayFilter<T, K>;
} 
;


// type Filters<T> = {
//     [K in keyof UnionToIntersection<T>]?: AllowedValues<T, K> | Array<AllowedValues<T, K>>;
// };


export type FilterValues<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};


// Extracts all possible values for key K across the union T
// export type UnionValues<T, K extends keyof T> = T extends any ? (K extends keyof T ? T[K] : never) : never;

// Modified ConditionRecord that allows for specifying criteria as an array of possible values across the union
export type ConditionRecord<T> = {
  [K in keyof T]?: T[K] 
  | T[K][];
};

// type RecordFromCondition<T, C> = T extends T
//   ? { [K in keyof T & keyof C]: T[K] extends C[K] | (C[K] extends Array<infer U> ? U : never) ? true : false } extends Record<keyof C, true>
//     ? T
//     : never
//   : never;

type RecordFromCondition<T, C> = T extends T
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
): item is T & RecordFromCondition<T, C> {
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