
export type FlatFilters<T> =  { 
  [K in keyof T]?: SingleValueFilter<T, K> 
};


type SingleValueFilter<T, K extends keyof T> = T[K];

type NestedFilter<T> = { [K in keyof T]?: T[K] extends Record<string, any> ? NestableFilters<T[K]> : (SingleValueFilter<T, K>) }; 

export type NestableFilters<T> = NestedFilter<T> & FlatFilters<T>;

type FilterValues<F> = {
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

type State = {
  key: string;
};

type StateChangeEvent = {
  type: string;
  from: State;
  to: State;
};

type ChangeEventKeyFilter<E extends StateChangeEvent> = FlatFilters<
  ChangeEventKeys<E>
>;

type ChangeEventKeys<E extends StateChangeEvent> = 
E extends { type: infer T, from: infer F, to: infer To }
  ? { type: T, from: F extends State ? F['key'] : never, to: To extends State ? To['key'] : never }
  : never;

export function matchesChangeEventKeys<
  E extends StateChangeEvent,
  F extends ChangeEventKeyFilter<E>,
  FV extends FilterValues<F>
>(
  changeEvent: E,
  filter: F
): changeEvent is E & HasFilterValues<E, {
  type: FV['type'];
  to: { key: FV['to'] };
  from: { key: FV['from'] };
}> {
  // Implementation remains the same
  return true;
}


// USAGE CODE BELOW THIS LINE

type PromiseStates = {
  Idle: { key: 'Idle' }
  Pending: { key: 'Pending', args: any[] },
  Rejected: { key: 'Rejected', error: Error},
  Resolved: { key: 'Resolved', data: any }
}

type PromiseTransitions_FYI = {
  Idle: { execute: "Pending" };
  Pending: {
    resolve: "Resolved";
    reject: "Rejected";
  };
  Resolved: {};
  Rejected: {};
};


type PromiseEvent = 
{ type: 'execute', from: PromiseStates['Idle'], to: PromiseStates['Pending'] } |
{ type: 'resolve', from: PromiseStates['Pending'], to: PromiseStates['Resolved'] } | 
{ type: 'reject', from: PromiseStates['Pending'], to: PromiseStates['Rejected']}


// type ChangeEvents<E extends StateChangeEvent> = 
//   E extends { type: infer T, from: infer F, to: infer To }
//     ? { type: T, from: F extends State ? { key: F['key']} : never, to: To extends State ? { key: To['key']} : never }
//     : never;  

// type X = ChangeEventKeys<PromiseEvent>;
// type X2 = ChangeEvents<PromiseEvent>


// type X3 = FilterValues<{ type: 'execute', from: PromiseStates['Idle'], to: PromiseStates['Pending'] }>
// type X4 = HasFilterValues<PromiseEvent, { from: PromiseStates['Pending']}>
// type X5 = HasFilterValues<PromiseEvent, { from: { key: 'Idle' }}>
 
const e = {} as PromiseEvent

// filter autocomplete is correct when beginning with type, but not when ending with type
// meaning, type is constraining state keys, but state key values are not constraining type values
// correctly constrains e to only possible values, with const
if (matchesPropertyFilters(e, {
  to: { key: 'Pending', args: [] as any},
} as const)){
  e.type = 'execute'
  e.from.key = 'Idle'
  e.to.key = 'Pending'  
}

// does autocomplete filter values constrained by existing filter values
// does correctly constrain e to only possible values, with const
if (matchesPropertyFilters(e, {
  from: { key: 'Idle'},
  type: 'execute',
  to: { key: 'Pending', args: [] as any } // this autocompletes to being only pending. but requires args too
} as const)){
  e.type = 'execute'
  e.from.key = 'Idle'
  e.to.key = 'Pending'
}

// autocompletes and constrains e correctly with const
if (matchesPropertyFilters(e, {
  from: { key: 'Pending', args: [] as any},
  to: { key: 'Rejected', error: new Error('')},
} as const)) {
  e.type = 'reject'
}

// constrains correctly but requires full state rather than just key
if (matchesPropertyFilters(e, {  
  to: { key: 'Resolved', data: {} as any},  
} as const)){
  e.type = 'resolve'
}

// constrains e to only possible values
if (matchesChangeEventKeys(e, {
  to: 'Rejected',
} as const)) {
  e.from.key = 'Pending'
  e.type = 'reject'
  e.to.key = 'Rejected'  
}

// not constraining e
if (matchesChangeEventKeys(e, {  
  to: 'Pending'
} as const)){
  e.type = 'execute'
}

if (matchesChangeEventKeys(e, {
  from: 'Idle',
  to: 'Pending'
} as const)){
  e.type = 'execute'
}

if (matchesChangeEventKeys(e, {
  from: 'Pending',// to: 'Rejected'
} as const)){
  e.type = 'reject'
  
}