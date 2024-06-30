import {
  FlatFilters,
  HasFilterValues,
  matchKey,
} from "./match-filters";
import { State } from "./state-machine";


export type StateChangeEvent = {
  type: string;
  from: State;
  to: State;
};

export type ChangeEventKeyFilter<E extends StateChangeEvent> = FlatFilters<
  ChangeEventKeys<E>
>;

export type ChangeEventKeys<E extends StateChangeEvent> = E extends {
  type: infer T;
  from: infer F;
  to: infer To;
}
  ? {
      type: T;
      from: F extends State ? F["key"] : never;
      to: To extends State ? To["key"] : never;
    }
  : never;

export function matchChange<
  E extends StateChangeEvent,
  Type extends ChangeEventKeyFilter<E>['type'] = ChangeEventKeyFilter<E>['type'],
  From extends ChangeEventKeyFilter<E>['from'] = ChangeEventKeyFilter<E>['from'],
  To extends ChangeEventKeyFilter<E>['to'] = ChangeEventKeyFilter<E>['to'],
>(
  changeEvent: E,
  // { type, from, to }: F,
  ...rest: 
    | [type?: Type, from?: From, to?: To] 
    | [filter: ChangeEventKeyFilter<E> & { type?: Type, from?: From, to?: To }]
): changeEvent is E &
  HasFilterValues<
    E,
    {
      type: Type;
      to: { key: To };
      from: { key: From };
    }
  > {
  const [type, from, to] = getFilter(rest)
  return (
    matchKey(to, changeEvent?.to?.key) &&
    matchKey(type, changeEvent?.type) &&
    matchKey(from, changeEvent?.from?.key)
  );
}

type ChangeFilterTuple = [type?: string, from?: string, to?: string];

function getFilter(parts: 
  | ChangeFilterTuple 
  | [filter: { type?: string, from?: string, to?: string }]
): [type?: string, from?: string, to?: string]  {
  if (parts.length === 1 && typeof parts[0] === 'object') {
    const filter = parts[0]
    return [filter.type, filter.from, filter.to]
  }
  return parts as any
}



export const isEntry = <E extends StateChangeEvent>(
  ev: E, 
  to: E['to']['key'], 
  type?: E['type'], 
  from?: E['from']['key']
) => matchChange<E>(ev, type, from, to)

export const isExit = <E extends StateChangeEvent>(
  ev: E, 
  from: E['from']['key'],
  to?: E['to']['key'], 
  type?: E['type'], 
) => matchChange<E>(ev, type, from, to)

export const entryware = <E extends StateChangeEvent>(
  ...params: 
  [
    to: E['to']['key'] | ChangeEventKeyFilter<E>,     
    handler: (ev: E) => void | ((ev: E) => void)
  ] | [
    to: E['to']['key'] | ChangeEventKeyFilter<E>, 
    type: E['type'],     
    handler: (ev: E) => void | ((ev: E) => void)
  ] | [    
      to: E['to']['key'] | ChangeEventKeyFilter<E>, 
      type: E['type'], 
      from: E['from']['key'],
      handler: (ev: E) => void
  ]
) => (ev: E) => {
  const handler = params[params.length - 1] as (ev: E) => any
  const filters = params.slice(0, -1)
  const filter = getFilter(filters as any)
  // const filter = getFilter([)
  if(isEntry(ev, filter[0]!, filter[1], filter[2])) {
    return handler(ev)  
  }
} 

