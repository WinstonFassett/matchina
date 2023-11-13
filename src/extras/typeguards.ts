import {
  ChangeEventType,
  ChangeEventToKey,
  ChangeEventFromKey,
} from "../../playground/typeguard.usage";

export type ChangeEvent<Type, To, From> = {
  type: Type;
  to: To;
  from: From;
};
type RecordFilter<T> = {
  [K in keyof T]?: T[K] | T[K][];
};
export type ChangeEventFilter<Type, To, From> = RecordFilter<
  ChangeEvent<Type, To, From>
>;

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

export type KeyedChangeEvent<Type, FromKey, ToKey> = ChangeEvent<
  Type,
  { key: ToKey },
  { key: FromKey }
>;


export type KeyedChangeEventFilter<E> = RecordFilter<
  KeyedChangeEvent<
    ChangeEventType<E>,
    ChangeEventToKey<E>,
    ChangeEventFromKey<E>
  >
>;

export function isKeyedChangeEvent<E>(
  event: E,
  filter: KeyedChangeEventFilter<E>,
): event is E & KeyedChangeEvent<
  ChangeEventType<E>,
  ChangeEventFromKey<E>,
  ChangeEventToKey<E>
> {
  const subject = event as any;
  console.log('checking', subject.type, filter)
  return (
    matchKey(filter.to, subject?.to?.key) &&
    matchKey(filter.type, subject?.type) &&
    matchKey(filter.from, subject?.from?.key)
  );
}

export function isChangeTypeToFrom<
  E,
  Type extends ChangeEventType<E>,
  ToKey extends ChangeEventToKey<E>,
  FromKey extends ChangeEventFromKey<E>,
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
  Type extends ChangeEventType<E>,
  ToKey extends ChangeEventToKey<E>,
  FromKey extends ChangeEventFromKey<E>,
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
