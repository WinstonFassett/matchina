import { matchesPropertyFilters, matchesChangeEventKeys } from "./match-property-filters";

// USAGE CODE BELOW THIS LINE
type PromiseStates = {
  Idle: { key: 'Idle'; };
  Pending: { key: 'Pending'; args: any[]; };
  Rejected: { key: 'Rejected'; error: Error; };
  Resolved: { key: 'Resolved'; data: any; };
};
type PromiseTransitions_FYI = {
  Idle: { execute: "Pending"; };
  Pending: {
    resolve: "Resolved";
    reject: "Rejected";
  };
  Resolved: {};
  Rejected: {};
};
type PromiseEvent =
  { type: 'execute'; from: PromiseStates['Idle']; to: PromiseStates['Pending']; } |
  { type: 'resolve'; from: PromiseStates['Pending']; to: PromiseStates['Resolved']; } |
  { type: 'reject'; from: PromiseStates['Pending']; to: PromiseStates['Rejected']; };
// type ChangeEvents<E extends StateChangeEvent> = 
//   E extends { type: infer T, from: infer F, to: infer To }
//     ? { type: T, from: F extends State ? { key: F['key']} : never, to: To extends State ? { key: To['key']} : never }
//     : never;  
// type X = ChangeEventKeys<PromiseEvent>;
// type X2 = ChangeEvents<PromiseEvent>
// type X3 = FilterValues<{ type: 'execute', from: PromiseStates['Idle'], to: PromiseStates['Pending'] }>
// type X4 = HasFilterValues<PromiseEvent, { from: PromiseStates['Pending']}>
// type X5 = HasFilterValues<PromiseEvent, { from: { key: 'Idle' }}>
const e = {} as PromiseEvent;
// filter autocomplete is correct when beginning with type, but not when ending with type
// meaning, type is constraining state keys, but state key values are not constraining type values
// correctly constrains e to only possible values, with const
if (matchesPropertyFilters(e, {
  to: { key: 'Pending', args: [] as any },
} as const)) {
  e.type = 'execute';
  e.from.key = 'Idle';
  e.to.key = 'Pending';
}
// does autocomplete filter values constrained by existing filter values
// does correctly constrain e to only possible values, with const
if (matchesPropertyFilters(e, {
  from: { key: 'Idle' },
  type: 'execute',
  to: { key: 'Pending', args: [] as any } // this autocompletes to being only pending. but requires args too
} as const)) {
  e.type = 'execute';
  e.from.key = 'Idle';
  e.to.key = 'Pending';
}
// autocompletes and constrains e correctly with const
if (matchesPropertyFilters(e, {
  from: { key: 'Pending', args: [] as any },
  to: { key: 'Rejected', error: new Error('') },
} as const)) {
  e.type = 'reject';
}
// constrains correctly but requires full state rather than just key
if (matchesPropertyFilters(e, {
  to: { key: 'Resolved', data: {} as any },
} as const)) {
  e.type = 'resolve';
}
// constrains e to only possible values
if (matchesChangeEventKeys(e, {
  to: 'Rejected',
} as const)) {
  e.from.key = 'Pending';
  e.type = 'reject';
  e.to.key = 'Rejected';
}
// not constraining e
if (matchesChangeEventKeys(e, {
  to: 'Pending'
} as const)) {
  e.type = 'execute';
}
if (matchesChangeEventKeys(e, {
  from: 'Idle',
  to: 'Pending'
} as const)) {
  e.type = 'execute';
}
if (matchesChangeEventKeys(e, {
  from: 'Pending', // to: 'Rejected'
} as const)) {
  e.type = 'reject';

}
