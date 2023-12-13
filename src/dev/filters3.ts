

// Extracts all possible values for key K across the union T
type UnionValues<T, K extends keyof any> = T extends any ? (K extends keyof T ? T[K] : never) : never;

// Modified ConditionRecord that allows for specifying criteria as an array of possible values across the union
export type ConditionRecord<T> = {
  [K in keyof T]?: T[K] | Array<UnionValues<T, K>>;
};
type RecordFromCondition<T, C> = T extends T
  ? { [K in keyof T & keyof C]: T[K] extends C[K] | (C[K] extends Array<infer U> ? U : never) ? true : false } extends Record<keyof C, true>
    ? T
    : never
  : never;

type UnionSpec<Val = any> = {
  [k: string]: Val;
}

function isRecord<T, C extends UnionSpec>(
  item: T,
  condition: C
): item is T & RecordFromCondition<T, C> {
  return true;
}

type PromiseTransitions = {
  Idle: { execute: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
  Resolved: {},
  Rejected: {},
};

type FlattenTransitions<T> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? {
        [P in keyof T[K]]: {
          from: K;
          type: P;
          to: T[K][P];
        };
      }[keyof T[K]]
    : never;
}[keyof T];

type X = FlattenTransitions<PromiseTransitions>;
const x = {} as X

type Z = RecordFromCondition<FlattenTransitions<PromiseTransitions>,{ to: 'Rejected' }>

if (isRecord(x, { to: 'Rejected' as const, from: 'Pending' as const })) {
  // narrowed type here
  x.from = 'Pending'
  x.to = 'Rejected'
  x.type = 'reject'
  // x.to = 'Rejected'
  // x.type = 'reject'
}