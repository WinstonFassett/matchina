import {
  AnyFactoryMachineEvent,
  AnyFactoryMachineTransition,
} from "./factory-machine";
import { Filters, HasFilterValues, matchKey, matchesPropertyFilters } from "./match-property-filters";


export function isKeyedChangeEvent <E extends KeyedChangeEvent, F extends Filters<ChangeEventKeys<E>>>(
  ev: E, 
  filter: F): ev is E & KeyedChangeEventFromFilter<E, F> {
    const {type, to: { key: to }, from: { key: from }} = ev
    return matchesPropertyFilters({
      type, to, from
    }, filter)
}


export type KeyedChangeEvent<
  Type extends string = string,
  FromKey extends string = string,
  ToKey extends string = FromKey,
> = {
  type: Type;
  from: { key: FromKey };
  to: { key: ToKey };
};


export type KeyedChangeEventFilter<E extends KeyedChangeEvent> = Filters1<{
  type: E["type"];
  to: E["to"]["key"];
  from: E["from"]["key"];
}>;

export type ChangeEventKeys<E extends KeyedChangeEvent> = {
  type: E["type"];
  to: E["to"]["key"];
  from: E["from"]["key"];
};

export type KeyedChangeEventFromFilter<
  E extends KeyedChangeEvent,
  F extends Filters<ChangeEventKeys<E>>,
  // FV extends FilterValues<F> = FilterValues<F>,
  FV extends HasFilterValues<E, F> = HasFilterValues<E, F>
> = 
{
  type: FV['type'];
  from: { key: FV['from'] };
  to: { key: FV['to'] };
}

export type FactoryChangeEventFilter<
  E extends AnyFactoryMachineEvent<any>,
  FromKey extends string &
    AnyFactoryMachineTransition<M>["from"]["key"] = string &
    AnyFactoryMachineTransition<E["machine"]>["from"]["key"],
  Type extends string & AnyFactoryMachineTransition<M>["type"] = string &
    AnyFactoryMachineTransition<E["machine"]>["type"],
  ToKey extends string & AnyFactoryMachineTransition<M>["to"]["key"] = string &
    AnyFactoryMachineTransition<E["machine"]>["to"]["key"],
  M extends E["machine"] = E["machine"],
> = {
  from?: FromKey | FromKey[];
  type?: Type | Type[];
  to?: ToKey | ToKey[];
};

export type FactoryChangeEventFromFilter<
  E extends AnyFactoryMachineEvent<any>,
  F extends FactoryChangeEventFilter<E>,
  FV extends FilterValues<F> = FilterValues<F>,
> = AnyFactoryMachineTransition<
  E["machine"],
  FV["from"] extends string ? FV["from"] : string,
  FV["type"] extends string ? FV["type"] : string,
  FV["to"] extends string ? FV["to"] : string
>;



export function isKeyedChangeEvent1<
  E extends KeyedChangeEvent,
  Type extends string & E["type"] = string & E["type"],
  ToKey extends string & E["to"]["key"] = string & E["to"]["key"],
  FromKey extends string & E["from"]["key"] = string & E["from"]["key"],
>(event: E, ...rest: 
  [filter: KeyedChangeEventFilter<E>] | [
    type?: KeyedChangeEventFilter<E>['type'],
    from?: KeyedChangeEventFilter<E>['from'],
    to?: KeyedChangeEventFilter<E>['type']
  ]
  ): event is E & KeyedChangeEventFromFilter<E, {
    type: Type;
    from: FromKey;
    to: ToKey;
  }> {
  const filter = typeof rest[0] === 'string' 
    ? { type: rest[0], from: rest[1], to: rest[2] }
    : rest[0] as KeyedChangeEventFilter<E>;
  const subject = event as any;
  const matched =
    matchKey(filter.to, subject?.to?.key) &&
    matchKey(filter.type, subject?.type) &&
    matchKey(filter.from, subject?.from?.key);
  return matched;
}

export const isFactoryMachineEvent: <
  E extends AnyFactoryMachineEvent<any>,
  Type extends string &    
    AnyFactoryMachineTransition<E["machine"]>["type"],
  FromKey extends string & 
    AnyFactoryMachineTransition<E["machine"], any, Type>["from"]["key"],
  ToKey extends string &    
    AnyFactoryMachineTransition<
      E["machine"], 
      FromKey extends never ? E['from'] : FromKey, 
      Type extends never ? E['type'] : Type, 
      any
    >["to"]["key"],
>(
  event: E,
  ...rest: [
    filter: {
      type?: Type | Type[];
      from?: FromKey | FromKey[];
      to?: ToKey | ToKey[];
    },
  ] | [
    type?: Type | Type[],
    from?: FromKey | FromKey[],
    to?: ToKey | ToKey[]
  ]  
) => event is E &
  FactoryChangeEventFromFilter<E, { from: FromKey extends never ? any : FromKey; type: Type extends never ? any : Type; to: ToKey extends never ? any : ToKey }> =
  isKeyedChangeEvent as any;

export function isFactoryMachineChangeFromTypeTo<
  E extends AnyFactoryMachineEvent<any>,
  FromKey extends string & E["from"]["key"],
  Type extends string &
    E["type"] &
    AnyFactoryMachineTransition<E["machine"], FromKey>["type"],
  ToKey extends string &
    E["to"]["key"] &
    AnyFactoryMachineTransition<E["machine"], FromKey, Type>["to"]["key"],
>(
  event: E,
  from?: FromKey | FromKey[],
  type?: Type | Type[],
  to?: ToKey | ToKey[],
): event is E &
  FactoryChangeEventFromFilter<E, { from: FromKey; type: Type; to: ToKey }> {
  const subject = event as any;
  return (
    matchKey(to, subject?.to?.key) &&
    matchKey(type, subject?.type) &&
    matchKey(from, subject?.from?.key)
  );
}

export function isChangeTypeToFrom<
  E,
  Type extends string,
  ToKey extends string,
  FromKey extends string,
>(
  event: E,
  type?: Type | Type[],
  to?: ToKey | ToKey[],
  from?: FromKey | FromKey[],
): event is E & KeyedChangeEvent<Type, FromKey, ToKey> {
  const subject = event as any;
  return (
    matchKey(to, subject?.to?.key) &&
    matchKey(type, subject?.type) &&
    matchKey(from, subject?.from?.key)
  );
}
export function asChangeTypeToFrom<
  E,
  Type extends string,
  ToKey extends string,
  FromKey extends string,
>(
  event: E,
  type?: Type | Type[],
  to?: ToKey | ToKey[],
  from?: FromKey | FromKey[],
): E & KeyedChangeEvent<Type, FromKey, ToKey> {
  if (isChangeTypeToFrom(event, type, to, from)) {
    return event;
  }
  throw new Error("not a match");
}
export type Filters1<T> = object & {
  [K in keyof T]?: T[K] | T[K][];
};

export type FilterValues<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};
