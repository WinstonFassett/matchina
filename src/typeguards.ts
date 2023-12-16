import {
  AnyFactoryMachineEvent,
  AnyFactoryMachineTransition,
} from "./factory-machine";

export type AnyKeyedChangeEvent = {
  type: string;
  to: { key: string };
  from: { key: string };
};

export type KeyedChangeEvent<
  Type extends string,
  ToKey extends string,
  FromKey extends string,
> = {
  type: Type;
  to: { key: ToKey };
  from: { key: FromKey };
};

export function hasKeyValue<T, K extends PropertyKey, V>(
  obj: T,
  key: K,
  values: V | V[],
): obj is T & Record<K, V> {
  if (!Array.isArray(values)) {
    return (obj as Record<K, V>)[key] === values;
  }
  return values.includes((obj as Record<K, V>)[key]);
}

function matchKey<T>(keyOrKeys: T | T[] | undefined, value: T) {
  if (keyOrKeys === undefined) {
    return true;
  }
  return Array.isArray(keyOrKeys)
    ? keyOrKeys.includes(value)
    : keyOrKeys === value;
}

export type KeyedChangeEventFilter<E extends AnyKeyedChangeEvent> = Filters<{
  type: E["type"];
  to: E["to"]["key"];
  from: E["from"]["key"];
}>;

export type KeyedChangeEventFromFilter<
  F extends KeyedChangeEventFilter<any>,
  FromKey = FilterValues<F>["from"] extends string
    ? FilterValues<F>["from"]
    : string,
  Type = FilterValues<F>["type"] extends string
    ? FilterValues<F>["type"]
    : string,
  ToKey = FilterValues<F>["to"] extends string ? FilterValues<F>["to"] : string,
> = {
  type: Type;
  from: { key: FromKey };
  to: { key: ToKey };
};

export type FactoryChangeEventFromFilter1<
  E extends AnyFactoryMachineEvent<any>,
  F extends KeyedChangeEventFilter<E>,
> = {
  f: F;
  from: FilterValues<F>["from"] extends string
    ? FilterValues<F>["from"]
    : string;
  type: FilterValues<F>["type"] extends string
    ? FilterValues<F>["type"]
    : string;
  to: FilterValues<F>["to"] extends string ? FilterValues<F>["to"] : string;
};

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

// export function isKeyedChangeEvent<
//   E extends AnyKeyedChangeEvent,
//   FromKey extends string & E["from"]["key"],
//   Type extends string & E["type"],
//   ToKey extends string & E["to"]["key"],
// >(
//   event: E,
//   type: Type,
//   from: FromKey,
//   to: ToKey
// ): event is E & KeyedChangeEventFromFilter<{
//   type: Type;
//   from: FromKey;
//   to: ToKey;
// }>;

// export function isKeyedChangeEvent<
//   E extends AnyKeyedChangeEvent,
//   F extends KeyedChangeEventFilter<E> = KeyedChangeEventFilter<E>,
// >(
//   event: E,
//   filter: {
//     type: string,
//     from: string,
//     to: string
//   }
// ): event is E & KeyedChangeEventFromFilter<F>;


export function isKeyedChangeEvent<
  E extends AnyKeyedChangeEvent,
  Type extends string & E["type"] = string & E["type"],
  ToKey extends string & E["to"]["key"] = string & E["to"]["key"],
  FromKey extends string & E["from"]["key"] = string & E["from"]["key"],
>(event: E, ...rest: 
  [filter: KeyedChangeEventFilter<E>] | [
    type?: KeyedChangeEventFilter<E>['type'],
    from?: KeyedChangeEventFilter<E>['from'],
    to?: KeyedChangeEventFilter<E>['type']
  ]
  ): event is E & KeyedChangeEventFromFilter<{
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
export type Filters<T> = object & {
  [K in keyof T]?: T[K] | T[K][];
};

export type FilterValues<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};
