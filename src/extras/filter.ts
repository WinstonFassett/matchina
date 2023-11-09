export {}

type ChangeEvent<Type, To, From> = {
  type: Type;
  to: To;
  from: From;
}

type State = {
  key: string
}

type RecordFilter<T> = {
  [K in keyof T]?: T[K] | T[K][];
}

type ChangeEventFilter<Type, To, From> = RecordFilter<ChangeEvent<Type, To, From>>;


function matchKey<T>(keyOrKeys: T|T[]|undefined, value:T ) {
  return keyOrKeys === undefined ? true : Array.isArray(keyOrKeys) ? keyOrKeys.includes(value) : keyOrKeys === value;
}

function hasKeyValue<T, K extends PropertyKey, V>(obj: T, key: K, value: V): obj is T & Record<K, V> {
  return (obj as Record<K, V>)[key] === value;
}
function hasKeyValues<T, K extends PropertyKey, V>(obj: T, key: K, values: V[]): obj is T & Record<K, V> {
  return values.includes((obj as Record<K, V>)[key]);
}

const a: unknown = {}
if (hasKeyValue(a, 'foo', 'bar' as const)) {
  a.foo
}
if (hasKeyValues(a, 'foo', ['manchu' as const, 'bar' as const])) {
  a.foo
}

export function isKeyedChangeEvent<
  Type extends string,
  ToKey extends PropertyKey,
  FromKey extends PropertyKey,
>(  
  event: any,
  filter: ChangeEventFilter<Type, ToKey, FromKey>,
): event is ChangeEvent<Type, { key: ToKey }, { key: FromKey }> {
  
  return (
    matchKey(filter.to, event.to?.key) &&
    matchKey(filter.type, event.type) &&
    matchKey(filter.from, event.from?.key)
  );
}

const ev = {} as ChangeEvent<unknown, unknown, unknown>
if (isKeyedChangeEvent(ev, { to: 'foo', from: 'bar', type: 'baz' })) {
  ev.to.key
  ev.from.key
  ev.type
}

type ChangeEventType<E> = E extends ChangeEvent<infer T, any, any> ? T : never;
type ChangeEventToKey<E> = E extends ChangeEvent<any, { key: infer K }, any> ? K : never;
type ChangeEventFromKey<E> = E extends ChangeEvent<any, any, { key: infer K }> ? K : never;

export function isChangeTypeToFrom<
  E extends ChangeEvent<any, { key: any }, { key: any }>,
  Type extends ChangeEventType<E>,
  ToKey extends ChangeEventToKey<E>,
  FromKey extends ChangeEventFromKey<E>,
>(  
  event: E,
  type?: Type|Type[],
  to?: ToKey|ToKey[],
  from?: FromKey|FromKey[],  
): event is E {
  
  return (
    matchKey(to, event.to.key) &&
    matchKey(type, event.type) &&
    matchKey(from, event.from.key)
  );
}


type HasKeyAndValue<K extends PropertyKey, V> = {
  [key in K]: V;
};

type PersonWithName<T extends string> = HasKeyAndValue<'name', T>;

function hasName<T extends string>(person: unknown, name: T): person is PersonWithName<T> {
  return typeof person === 'object' && person !== null && (person as PersonWithName<T>).name === name;
}

const alice = { name: 'Alice', age: 30 };
if (hasName(alice, 'Alice')) {
  // TypeScript knows that `person` has name 'Alice'
  alice.name;
  console.log(alice.age); // Error: Property 'age' does not exist on type 'PersonWithName<"Alice">'
}

const person: unknown = {  };
if (hasName(person, 'Alice')) {
  // TypeScript knows that `person` is a `Person` with name 'Alice'
  person.name

}

