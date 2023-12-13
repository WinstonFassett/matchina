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
  [K in keyof T]: {
    from: K;
    type: keyof T[K];
    to: T[K][keyof T[K]];
  };
}[keyof T];

type Filtered<T, U> = T extends U ? T : never;

type ConditionRecord<T> = {
  [K in keyof T]?: T[K];
};

type RecordFromCondition1<T> = {
  [K in keyof T]: T[K] extends Record<infer K1, infer V1>
    ? K1 extends keyof V1
      ? { from: K; type: K1; to: V1[K1] }
      : never
    : never;
};

type RecordFromCondition<T> = T;


// Usage
// type X2 = Filtered<FlattenTransitions<PromiseTransitions>, ConditionRecord<
//   FlattenTransitions<PromiseTransitions>
// >;

function isRecord<T, C extends ConditionRecord<T>>(
  item: T,
  condition: C
): item is T & RecordFromCondition<C> {
  return true;
}

const x = {} as FlattenTransitions<PromiseTransitions>;

if (isRecord(x, { to: 'Rejected', from: 'Pending', type: 'reject' } as const)) {
  // narrowed type here
  x.from = 'Pending'
  x.to = 'Rejected'
  x.type = 'reject'
}