export type Filters<T> = 
| { [K in keyof T]?: SingleValueFilter<T, K> } 
| { [K in UnionKeys<T>]?: AnyValueFilter<T, K> } 
;

// type NestedFilter<T> = { [K in keyof T]?: T[K] extends Record<string, any> ? Filters2<T[K]> : never };
type NestedFilter<T> = { [K in keyof T]?: T[K] extends Record<string, any> ? Filters2<T[K]> : (SingleValueFilter<T, K> 
  | AnyValueFilter<T,K>
) };

// or

// type NestedFilter<T> = { [K in keyof T]?: T[K] extends Record<string, any> ? Filters2<T[K]> : AnyValueFilter<T, K> };


// type FlatFilter<T> = { [K in UnionKeys<T>]?: AnyValueFilter<T, K> };
export type Filters2<T> = NestedFilter<T> & Filters<T>;


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

export function matchesPropertyFilters<T extends Record<string, any>, C extends Filters2<T>>(
  item: T,
  condition: C
): item is T & HasFilterValues<T, C> {
  return Object.keys(condition).every((key) => matchKey(condition[key as keyof C], (item)[key]));
}

export function asPropertyFilterMatch<T extends Record<string, any>, C extends Filters2<T>>(
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

type EventExitStates<E extends ChangeEvent> = {
  [K in E['to']['key']]: State;
};

type ChangeEvent = {
  type: string;
  from: State;
  to: State;
};

type ChangeEventKeyFilter<E extends ChangeEvent> = Filters<{
  type: E["type"];
  from: E["from"]["key"];
  to: E["to"]["key"];
}>


type HasTypeKeyAndStateObjectsFrom<
  E extends ChangeEvent, 
  F extends ChangeEventKeyFilter<E>, 
  S extends EventExitStates<E>
> = HasFilterValues<E,F> extends {
  type: infer Type;
  from: infer From;
  to: infer To;
}
  ? E extends {
      type: Type;
      from: From extends keyof S ? S[From] : S[keyof S];
      to: To extends keyof S ? S[To] : S[keyof S];
    }
    ? E
    : never
  : never;


function matchesChangeEventKeys<
  E extends ChangeEvent, 
  F extends ChangeEventKeyFilter<E>,
  S extends EventExitStates<E>
>(
  changeEvent: E,
  filter: F,  
): changeEvent is E & HasTypeKeyAndStateObjectsFrom<E, F, S>  {
  // any idiot can figure out the fucking implementation
  // FOCUS ON THE TYPES
  return true
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


const e = {} as PromiseEvent

// filter autocomplete is correct when beginning with type, but not when ending with type
// correctly constrains e to only possible values, with const
if (matchesPropertyFilters(e, {
  type: 'execute',
  to: { key: 'Pending', args: [] as any },
  from: { key: 'Idle'}
} as const)){
  e.type = 'execute'
  e.from.key = 'Idle'
  e.to.key = 'Pending'
}

// filter autocomplete does not constrain type by state keys
// but does autocomplete states constrained by type
// does correctly constrain e to only possible values, with const
if (matchesPropertyFilters(e, {
  from: { key: 'Idle'},
  type: 'execute',
  to: { key: 'Pending', args: [] as any } // this autocompletes to being only pending
} as const)){
  e.type = 'execute'
  e.from.key = 'Idle'
  e.to.key = 'Pending'
}

// filter autocomplete does not constrain other values by specified values
// constrains e correctly with const, but const won't allow empty args
if (matchesPropertyFilters(e, {
  from: { key: 'Pending', args: [] as any},
  to: { key: 'Rejected', error: new Error('')},
  // type: 'resolve'
  // to: { key: 'Pending', args: []}
} as const)) {
  e.type = 'reject'
}

if (matchesPropertyFilters(e, {
  // to: { key: 'Pending' } // invalid for some reason
  // to: { key: ['Rejected'], error: new Error('')},
  to: { key: 'Resolved', data: ''},
  // type: 'execute'
} as const)){
  // e.type = 'execute'
  e.type = 'resolve'
}

// constrains e to only possible values
// but filter autocomplete is not correct, does not constrain other values by specified values, 
// and allows conflicting filter values which then mess up the constraints on e
if (matchesChangeEventKeys(e, {
  type: 'reject',
  to: 'Pending'
} as const)) {
  e.from.key = 'Pending'
  e.type = 'reject'
  e.to.key = 'Rejected'
}

// filter autocomplete is not correct, does not constrain other values by specified values
// not constraining e
if (matchesChangeEventKeys(e, {
  type: 'execute', 
  to: 'Rejected'
} as const)){
  e.type = 'execute'
}

if (matchesChangeEventKeys(e, {
  // from: ['Pending', 'Idle'],   
  to: ['Resolved', 'Rejected']
} as const)){
  e.type = 'execute' // invalid
}