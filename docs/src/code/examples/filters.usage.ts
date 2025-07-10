import { matchFilters } from "matchina";

type PromiseTransitions = {
  Idle: { execute: "Pending" };
  Pending: {
    resolve: "Resolved";
    reject: "Rejected";
  };
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
const x = {} as X;
if (
  matchFilters(x, { type: "reject", to: "Rejected", from: "Pending" })
) {
  // narrowed type here
  x.from = "Pending";
  x.to = "Rejected";
  x.type = "reject";
}

if (
  matchFilters(x, {
    type: "execute",
    from: "Idle",
    to: "Pending",
  } as const)
) {
  // narrowed type here
  x.from = "Idle";
  x.type = "execute";
  x.to = "Pending";
}

if (
  matchFilters(x, {
    type: "execute",
    to: "Pending",
    // type: 'execute', to: 'Pending'
  } as const)
) {
  x.from = "Idle";
  x.to = "Pending";
  x.type = "execute";
}

// if (matchesPropertyFilters(x, {
//   from: ['Pending']
//   // from: { key: ['Pending']},
//   // to: ['Rejected']
//   // to: ['Rejected']
// } as const)){
//   x.from = 'Pending'
//   x.type = 'reject'
// }

// if (matchesPropertyFilters(x, {
//   type: ['reject', 'resolve']
//   // from: ['Idle', 'Pending'],
//   // to: ['Rejected']
// } as const)){
//   x.from = 'Idle'
//   x.type = 'execute'
// }
