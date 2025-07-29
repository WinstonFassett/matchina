import {
  MatchboxFactory,
  MatchboxMember,
  MatchCases,
  TaggedTypes,
} from "./matchbox-factory-types";

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @template Config - The configuration object or array of tags
 * @template TagProp - The property name used for the tag (default: "tag")
 * @returns An object with constructors for each variant, type predicates, and match function
 *
 * @example
 * ```ts
 * // Define a union of variants for a Result type
 * const Result = matchboxFactory({
 *   Ok: (value: number) => ({ value }),
 *   Err: (error: string) => ({ error }),
 * });
 *
 * // Create instances
 * const ok = Result.Ok(42);
 * const err = Result.Err("fail");
 *
 * // Type predicates
 * ok.is("Ok"); // true
 * err.is("Err"); // true
 *
 * // Pattern matching
 * const message = ok.match({
 *   Ok: ({ value }) => `Value: ${value}`,
 *   Err: ({ error }) => `Error: ${error}`,
 * });
 * // message === "Value: 42"
 * ```
 */
export function matchboxFactory<
  Config extends TaggedTypes | string,
  TagProp extends string = "tag",
  R = MatchboxFactory<
    Config extends ReadonlyArray<string>
      ? {
          [K in Config[number]]: (data: any) => any;
        }
      : Config,
    TagProp
  >,
>(config: Config, tagProp = "tag" as TagProp): R {
  if (Array.isArray(config)) {
    const spec: Record<string, (data: any) => any> = {};
    for (const tag of config as string[]) {
      spec[tag] = (data: any) => data;
    }
    return matchboxFactory(spec, tagProp) as R;
  }

  const createObj: any = {};
  for (const tag in config) {
    const spec = (config as TaggedTypes)[tag];
    createObj[tag] = (...args: any) => {
      return matchbox<Config, any, TagProp>(
        tag,
        typeof spec === "function" ? spec(...args) : spec,
        tagProp
      );
    };
  }
  return createObj as R;
}

/**
 * matchbox creates a single Matchbox variant instance.
 *
 * @param tag - The tag value for the variant.
 * @param data - The data associated with the variant.
 * @param tagProp - The property name used for the tag (default: "tag").
 * @returns A Matchbox instance with type-safe API methods.
 */
export function matchbox<
  DataSpecs,
  Tag extends keyof DataSpecs,
  TagProp extends string = "tag",
>(
  tag: Tag,
  data: any,
  tagProp: TagProp = "tag" as TagProp
): MatchboxMember<Tag, DataSpecs, TagProp> {
  return new MatchboxImpl<DataSpecs, Tag, TagProp>(tag, data, tagProp) as any;
}

class MatchboxImpl<
  Config,
  Tag extends keyof Config = keyof Config,
  TagProp extends string = "tag",
> {
  [key: string]: any;

  constructor(
    tag: Tag,
    public data: Config[Tag],
    tagProp: TagProp = "tag" as TagProp
  ) {
    Object.assign(this, {
      [tagProp]: tag,
      getTag: () => this[tagProp],
    });
  }

  /**
   * Casts this instance to the specified tag type, throwing if the tag does not match.
   * @param expectedTag - The expected tag value.
   */
  as(expectedTag: keyof Config) {
    if (!this.is(expectedTag)) {
      const tag = this.getTag();
      throw new Error(`Attempted to cast ${tag} as ${expectedTag.toString()}`);
    }
    return this;
  }

  /**
   * Type predicate for narrowing to a specific variant by tag.
   * @param tag - The tag value to check.
   */
  is(tag: keyof Config) {
    return this.getTag() === tag;
  }

  match<A>(casesObj: MatchCases<Config, A, true>, exhaustive?: boolean): any;
  match<A>(casesObj: MatchCases<Config, A, false>, exhaustive: boolean): any;
  match<A>(
    casesObj: MatchCases<Config, A, boolean>,
    exhaustive?: boolean
  ): any {
    const tag = this.getTag();
    const data = this.data;
    if (exhaustive === false) {
      const fallback = (casesObj as any)._;
      const fn = (casesObj as any)[tag] ?? fallback;
      return typeof fn === "function" ? fn(data) : undefined;
    }
    if (typeof (casesObj as any)[tag] === "function") {
      return (casesObj as any)[tag](data);
    }
    const fallback = (casesObj as any)._;
    if (typeof fallback === "function") {
      return fallback(data);
    }
    throw new Error(`Match did not handle key: '${tag}'`);
  }
}

// --- Type simplification test for InferMatchboxOutput ---
import { InferMatchboxOutput, InferMatchboxInstances } from "./matchbox-factory-types";

// Define a real matchbox factory
export const TestBox = matchboxFactory({
  Foo: (x: number) => ({ value: x }),
  Bar: (msg: string) => ({ message: msg }),
  Baz: () => ({ flag: true }),
});

const x = TestBox.Foo(123);

type TestBoxUnion = ReturnType<typeof TestBox[keyof typeof TestBox]>;
// This will be a union of all possible instance types

// Type: {
//   Foo: (x: number) => { data: { value: number }, tag: "Foo", ...api };
//   Bar: (msg: string) => { data: { message: string }, tag: "Bar", ...api };
//   Baz: () => { data: { flag: boolean }, tag: "Baz", ...api };
// }
export type TestBoxOutput = InferMatchboxInstances<typeof TestBox>;
// Hover over TestBoxOutput in your IDE to see the full factory type

// Test: treat TestBoxOutput like TestBox
const testBox: TestBoxOutput = TestBox;
const testFoo = testBox.Foo(123);
testFoo.is("Foo"); // true
testFoo.match({ Foo: ({ value }) => value }); // fully typed

// Type: {
//   Foo: { value: number };
//   Bar: { message: string };
//   Baz: { flag: boolean };
// }
export type TestBoxInstances = InferMatchboxInstances<typeof TestBox>;
// Hover over TestBoxInstances in your IDE to see the full instance types for each tag

// Example usage for runtime:
const foo = TestBox.Foo(123);
const bar = TestBox.Bar("hello");
const baz = TestBox.Baz();

const fooInstance = TestBox.Foo(123);
fooInstance.is("Foo"); // true
fooInstance.match({ Foo: ({ value }) => value });

type SimplifiedMatchbox<T extends { data: any; tag: string }> = {
  data: T['data'];
  tag: T['tag'];
  is: (tag: T['tag'] | string) => boolean;
  match: <A>(cases: { [K in T['tag']]?: (data: T['data']) => A } & { _: () => A }) => A;
};
type FooSimple = SimplifiedMatchbox<ReturnType<typeof TestBox.Foo>>;
// FooSimple = { data: { value: number }, tag: "Foo", is: ..., match: ... }
type TestBoxSimple = {
  [K in keyof typeof TestBox]:
    ReturnType<typeof TestBox[K]> extends { data: any; tag: string }
      ? SimplifiedMatchbox<ReturnType<typeof TestBox[K]>>
      : never;
};
const fooSimple: TestBoxSimple["Foo"] = {
  data: { value: 123 },
  tag: "Foo",
  is: (tag) => tag === "Foo",
  match: (cases) => (cases.Foo ? cases.Foo({ value: 123 }) : cases._()),
};
fooSimple.is("Foo"); // true
fooSimple.match({ Foo: ({ value }) => value, _: () => 0 }); // 123

import { SimplifiedMatchboxFactory } from "./matchbox-factory-types";

type TestFactorySimple = SimplifiedMatchboxFactory<typeof TestBox>;
const f = {} as TestFactorySimple;
const isFoo = f.Foo(123).is("Foo"); // true
const fooTag = f.Foo(123).tag; // true
const fooData = f.Foo(123).data.value
// Now: TestFactorySimple.Foo(123) returns a SimplifiedMatchbox with only data, tag, and is