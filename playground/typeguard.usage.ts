import {
  hasKeyValue,
  ChangeEvent,
  isKeyedChangeEvent,
  isChangeTypeToFrom,
  asChangeTypeToFrom,
} from "../src/dev/v1/extras/typeguards";

export {};

// usage

const a: unknown = {};
if (hasKeyValue(a, "foo", "bar" as const)) {
  a.foo;
}
if (hasKeyValue(a, "foo", ["manchu" as const, "bar" as const])) {
  a.foo;
}

const ev = {} as ChangeEvent<unknown, unknown, unknown>;
if (isKeyedChangeEvent(ev, { to: "foo", from: "bar", type: "baz" } as const)) {
  ev.to.key;
  ev.from.key;
  ev.type;
}

const ev2 = {} as unknown; // ChangeEvent<unknown, unknown, unknown>
if (isChangeTypeToFrom(ev2, "baz", "foo", "bar")) {
  ev2.to.key;
  ev2.from.key;
  ev2.type;
}

const x = asChangeTypeToFrom(
  ev2,
  "baz" as const,
  "foo" as "foo" | "foot",
  ["bar", "ball"] as ("bar" | "ball")[],
);
x.type = "baz";
x.to.key = "foo";
x.to.key = "foot";
x.from.key = "bar";
x.from.key = "ball";

type StateMachine = {
  state: string;
  transition: (action: string) => void;
};

// subscribeKeyedChangeEvent({
//   type: ['baz', 'bake'],
//   to: ['foo', 'foot'],
//   from: ['bar', 'ball'],
// }, (ev) => {
//   ev.type = 'baz'
//   ev.type = 'bake'
//   ev.to.key = 'foo'
//   ev.to.key = 'foot'
//   ev.from.key = 'bar'
//   ev.from.key = 'ball'
// })

type HasKeyAndValue<K extends PropertyKey, V> = {
  [key in K]: V;
};

type PersonWithName<T extends string> = HasKeyAndValue<"name", T>;

function hasName<T extends string>(
  person: unknown,
  name: T,
): person is PersonWithName<T> {
  return (
    typeof person === "object" &&
    person !== null &&
    (person as PersonWithName<T>).name === name
  );
}

const alice = { name: "Alice", age: 30 };
if (hasName(alice, "Alice")) {
  // TypeScript knows that `person` has name 'Alice'
  alice.name;
  console.log(alice.age); // Error: Property 'age' does not exist on type 'PersonWithName<"Alice">'
}

const person: unknown = {};
if (hasName(person, "Alice")) {
  // TypeScript knows that `person` is a `Person` with name 'Alice'
  person.name;
}
