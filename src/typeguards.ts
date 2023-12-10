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

export function isKeyedChangeEvent<
  E extends AnyKeyedChangeEvent,
  F extends KeyedChangeEventFilter<E> = KeyedChangeEventFilter<E>,
>(filter: F, event: E): event is E & KeyedChangeEventFromFilter<F> {
  const subject = event as any;
  const matched =
    matchKey(filter.to, subject?.to?.key) &&
    matchKey(filter.type, subject?.type) &&
    matchKey(filter.from, subject?.from?.key);
  // console.log('match?', matched, filter, event.type)
  return matched;
}

export const isFactoryMachineEvent: <
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
  filter: {
    from?: FromKey | FromKey[];
    type?: Type | Type[];
    to?: ToKey | ToKey[];
  },
) => event is E &
  FactoryChangeEventFromFilter<E, { from: FromKey; type: Type; to: ToKey }> =
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
