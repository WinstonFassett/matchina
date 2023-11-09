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

type KeyedChangeEvent<Type, FromKey, ToKey> = ChangeEvent<Type, { key: ToKey }, { key: FromKey }>;

export function isKeyedChangeEvent<
  E extends unknown,
  Type extends ChangeEventType<E>,
  ToKey extends ChangeEventToKey<E>,
  FromKey extends ChangeEventFromKey<E>,
>(  
  event: E,
  filter: ChangeEventFilter<Type, ToKey, FromKey>,
): event is E&KeyedChangeEvent<Type, FromKey, ToKey> {
  const subject = event as any
  return (
    matchKey(filter.to, subject?.to?.key) &&
    matchKey(filter.type, subject?.type) &&
    matchKey(filter.from, subject?.from?.key)
  );
}


const ev = {} as ChangeEvent<unknown, unknown, unknown>
if (isKeyedChangeEvent(ev, { to: 'foo', from: 'bar', type: 'baz' })) {
  ev.to.key
  ev.from.key
  ev.type
}

type ChangeEventType<E> = E extends ChangeEvent<infer T, any, any> ? T : string;
type ChangeEventToKey<E> = E extends ChangeEvent<any, { key: infer K }, any> ? K : string;
type ChangeEventFromKey<E> = E extends ChangeEvent<any, any, { key: infer K }> ? K : string;

export function isChangeTypeToFrom<
  E, // extends ChangeEvent<any, { key: any }, { key: any }>,
  Type extends ChangeEventType<E>,
  ToKey extends ChangeEventToKey<E>,
  FromKey extends ChangeEventFromKey<E>,
>(  
  event: E,
  type?: Type|Type[],
  to?: ToKey|ToKey[],
  from?: FromKey|FromKey[],  
): event is E&KeyedChangeEvent<Type, FromKey, ToKey> {
  const subject = event as any
  return (
    matchKey(to, subject?.to?.key) &&
    matchKey(type, subject?.type) &&
    matchKey(from, subject?.from?.key)
  );
}
const ev2 = {} as unknown // ChangeEvent<unknown, unknown, unknown>
if (isChangeTypeToFrom(ev2, 'baz', 'foo', 'bar')) {
  ev2.to.key
  ev2.from.key
  ev2.type
}

function asChangeTypeToFrom<
  E, // extends ChangeEvent<any, { key: any }, { key: any }>,
  Type extends ChangeEventType<E>,
  ToKey extends ChangeEventToKey<E>,
  FromKey extends ChangeEventFromKey<E>
>(
  event: E,
  type?: Type|Type[],
  to?: ToKey|ToKey[],
  from?: FromKey|FromKey[],  
): E&KeyedChangeEvent<Type, FromKey, ToKey> {
  if (isChangeTypeToFrom(event, type, to, from)) {
    return event
  }
  throw new Error('not a match')
}

const x = asChangeTypeToFrom(ev2, 'baz' as const, 'foo' as 'foo' | 'foot', ['bar', 'ball'] as ('bar' | 'ball')[])
x.type = 'baz'
x.to.key = 'foo'
x.to.key = 'foot'
x.from.key = 'bar'
x.from.key = 'ball'


type StateMachine = {
  state: string;
  transition: (action: string) => void;  
};

function subscribeKeyedChangeEvent<
  E extends unknown,
  Type extends ChangeEventType<E>,
  ToKey extends ChangeEventToKey<E>,
  FromKey extends ChangeEventFromKey<E>,
>(  
  filter: ChangeEventFilter<Type, ToKey, FromKey>,
  callback: (event: E&KeyedChangeEvent<Type, FromKey, ToKey>) => void,
) {
  // implementation not important
}

subscribeKeyedChangeEvent({
  type: ['baz', 'bake'],
  to: ['foo', 'foot'],
  from: ['bar', 'ball'],
}, (ev) => {
  ev.type = 'baz'
  ev.type = 'bake'
  ev.to.key = 'foo'
  ev.to.key = 'foot'
  ev.from.key = 'bar'
  ev.from.key = 'ball'
})

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

