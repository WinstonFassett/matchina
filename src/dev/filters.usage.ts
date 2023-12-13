import {  UnionValues, matchesPropertyFilters } from "./filters2";

type PromiseTransitions = {
  Idle: { execute: "Pending"; };
  Pending: {
    resolve: "Resolved";
    reject: "Rejected";
  };
  Resolved: {};
  Rejected: {};
};
type FlattenTransitions<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? {
    [P in keyof T[K]]: {
      from: K;
      type: P;
      to: T[K][P];
    };
  }[keyof T[K]] : never;
}[keyof T];


type X = FlattenTransitions<PromiseTransitions>;
const x = {} as X;
// type Z = MatchesUnionPropertyFilter<FlattenTransitions<PromiseTransitions>, { to: 'Rejected'; }>;
if (matchesPropertyFilters(x, {  })) {
  // narrowed type here
  x.from = 'Pending';
  x.to = 'Rejected';
  x.type = 'reject';
  // x.to = 'Rejected'
  // x.type = 'reject'
}


if (matchesPropertyFilters(x, { type: 'execute', to: 'Pending', from: 'Idle'} as const)) {
  // narrowed type here
  x.from = 'Idle'
  x.type = 'execute'
  x.to = 'Pending'
  // x.to = 'Rejected'
  // x.type = 'reject'
}

if (matchesPropertyFilters(x, {
  type: 'execute'
} as const)){
  x.from = 'Idle'
  x.to = 'Pending'
  x.type = 'execute'
}

if (matchesPropertyFilters(x, {
  from: ['Pending'], 
  to: ['Rejected']
} as const)){
  x.from = 'Pending'  
}

type Y = UnionValues<X,'from'>
const y: Y[] = ['Idle', 'Pending']

type Z = Extract<X, 'from'>