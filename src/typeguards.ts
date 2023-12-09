
export type AnyKeyedChangeEvent = {
  type: string
  to: { key: string }
  from: { key: string }  
}

export type KeyedChangeEvent<Type extends string, ToKey extends string, FromKey extends string> = {
  type: Type
  to: { key: ToKey }
  from: { key: FromKey }  
}

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
  type: E['type'],
  to: E['to']['key'],
  from: E['from']['key']
}>

export function isKeyedChangeEvent<
  E extends AnyKeyedChangeEvent,
>(
  filter: KeyedChangeEventFilter<E>,
  event: E,
): event is E & AnyKeyedChangeEvent {
  const subject = event as any;
  const matched =
    matchKey(filter.to, subject?.to?.key) &&
    matchKey(filter.type, subject?.type) &&
    matchKey(filter.from, subject?.from?.key);
  // console.log('match?', matched, filter, event.type)
  return matched;
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
