import { match } from "./match-case";
import { Simplify } from "./utility-types";

/**
 * FactoryShape defines the shape of a factory object, mapping string keys (tags) to constructor functions.
 */
interface FactoryShape {
  [key: string]: (...args: unknown[]) => unknown;
}

/**
 * Matchbox is a type representing a single variant instance in the tagged union.
 * It combines the constructed value, tag, data, and API methods for type narrowing and pattern matching.
 *
 * @template TagProp - The property name used for the tag (default: "tag").
 * @template F - The factory shape.
 * @template D - The data type for this variant.
 * @template K - The tag value for this variant.
 */
type Matchbox<
  TagProp extends string,
  F extends FactoryShape,
  D,
  K extends string & keyof F = string & keyof F,
> = ReturnType<F[K]> &
  MatchboxInstance<TagProp, K, D> &
  MatchboxApi<TagProp, F>;

/**
 * MatchboxInstance is the shape of a single Matchbox variant instance.
 * Contains the data and tag, plus a getter for the tag property.
 *
 * @template TagProp - The property name used for the tag.
 * @template Tag - The tag value.
 * @template Data - The data associated with this variant.
 */
export type MatchboxInstance<TagProp extends string, Tag extends string, Data> = {
  data: Data;
  getTag: () => Tag;
} & {
  [_ in TagProp]: Tag;
};

/**
 * MatchboxApi provides type-safe methods for working with Matchbox instances:
 * - is: Type predicate for narrowing to a specific variant.
 * - as: Casts to a specific variant, throws if the tag does not match.
 * - match: Pattern matching for variant data.
 *
 * @template TagProp - The property name used for the tag.
 * @template F - The factory shape.
 */
export interface MatchboxApi<
  TagProp extends string,
  F extends FactoryShape,
> {
  is: <K extends keyof F>(key: K) => this is Matchbox<TagProp, F, K>;
  as: <K extends keyof F>(key: K) => Matchbox<TagProp, F, K>;
  match: <A, Exhaustive extends boolean = true>(
    cases: { [K in keyof F]: (data: ReturnType<F[K]>) => A },
    exhaustive?: Exhaustive,
  ) => A;
}

/**
 * MemberCreateFromDataSpecs creates a constructor function for a Matchbox variant from its data specification.
 * If the spec is a function, the constructor accepts its arguments.
 * Otherwise, it returns the variant with the given value.
 *
 * @template Tag - The tag value.
 * @template DataSpecs - The record of data specifications.
 * @template TagProp - The property name used for the tag.
 */
export type MemberCreateFromDataSpecs<
  Tag extends keyof DataSpecs,
  DataSpecs,
  TagProp extends string,
> = DataSpecs[Tag] extends (...args: infer P) => infer _R
  ? (...args: P) => MatchboxMember<Tag, DataSpecs, TagProp>
  : () // value?: Specs[Tag]
    => MatchboxMember<Tag, DataSpecs, TagProp>;

/**
 * MatchboxFactory is the main output type for matchboxFactory.
 * It maps each tag in DataSpecs to a constructor function for its variant.
 * If the spec is a function, the constructor accepts its arguments; otherwise, it returns the variant with the value.
 *
 * This replaces UnionFromDataSpecs, CreatorsFromDataSpecs, and MatchboxFactoryFromData for clarity and simplicity.
 */
export type MatchboxFactory<DataSpecs, TagProp extends string = "tag"> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: infer P) => infer _R
    ? (...args: P) => MatchboxMember<T, DataSpecs, TagProp>
    : () => MatchboxMember<T, DataSpecs, TagProp>;
};

/**
 * MatchboxMember creates the type for a single Matchbox variant instance from its data specification.
 * Includes the data, tag property, and member extension methods (is, as, match).
 *
 * This replaces MemberFromDataSpecs for clarity and simplicity.
 */
export type MatchboxMember<
  Tag extends keyof DataSpecs,
  DataSpecs,
  TagProp extends string
> = ((DataSpecs[Tag] extends (...args: any[]) => any
  ? { data: ReturnType<DataSpecs[Tag]> }
  : { data: DataSpecs[Tag] }) & { [_ in TagProp]: Tag }) &
  MatchboxMemberApi<DataSpecs, TagProp>;

/**
 * Add conditional type for match cases to support exhaustiveness and fallback (_)
 * - _ is always allowed
 * - If _ is present, all tag cases become optional (exhaustiveness is satisfied)
 * - If _ is not present and exhaustive is true, all tags are required
 */
type MatchCases<
  DataSpecs,
  A,
  Exhaustive extends boolean = true
> =
  // If _ is present, all tags are optional (exhaustiveness is satisfied)
  (Partial<{ [K in keyof DataSpecs]: (data: MemberData<DataSpecs>[K]) => A }> & { _?: (...args: any[]) => A })
  // Otherwise, if exhaustive, all tags are required
  | (Exhaustive extends true
      ? { [K in keyof DataSpecs]: (data: MemberData<DataSpecs>[K]) => A }
      : Partial<{ [K in keyof DataSpecs]: (data: MemberData<DataSpecs>[K]) => A }>);

/**
 * MatchboxMemberApi provides type-safe methods for working with a Matchbox member:
 * - is: Type predicate for narrowing to a specific variant.
 * - as: Casts to a specific variant, throws if the tag does not match.
 * - match: Pattern matching for variant data.
 *
 * The match method is defined inline for clarity and simplicity.
 */
export interface MatchboxMemberApi<DataSpecs, TagProp extends string> {
  is: <T extends keyof DataSpecs>(key: T) => this is MatchboxMember<T, DataSpecs, TagProp>;
  as: <T extends keyof DataSpecs>(key: T) => MatchboxMember<T, DataSpecs, TagProp>;
  match<A>(cases: MatchCases<DataSpecs, A, true>, exhaustive?: boolean): A;
  match<A>(cases: MatchCases<DataSpecs, A, false>, exhaustive: boolean): A;
}

/**
 * MemberData maps each tag in DataSpecs to its corresponding value type.
 * If the spec is a function, uses its return type; otherwise, uses the value type directly.
 *
 * Used for pattern matching and type inference in MatchboxMember and related APIs.
 */
export type MemberData<DataSpecs> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: any[]) => any
    ? ReturnType<DataSpecs[T]>
    : DataSpecs[T];
};

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 */
export function matchboxFactory<
  Config extends SpecRecord | string,
  TagProp extends string = "tag",
  R = MatchboxFactory<
    Config extends ReadonlyArray<string> ? SpecFromStrings<Config> : Config,
    TagProp
  >,
>(config: Config, tagProp = "tag" as TagProp): R {
  // Fix Array#reduce lint error by using a for loop
  if (Array.isArray(config)) {
    const spec: Record<string, (data: any) => any> = {};
    for (const tag of config as string[]) {
      spec[tag] = (data: any) => data;
    }
    return matchboxFactory(spec, tagProp) as R;
  }

  const createObj: any = {};
  for (const tag in config) {
    const spec = (config as SpecRecord)[tag];
    createObj[tag] = (...args: any) => {
      return matchbox<Config, any, TagProp>(
        tag,
        typeof spec === "function" ? spec(...args) : spec,
        tagProp,
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
  tagProp: TagProp = "tag" as TagProp,
): MatchboxMember<Tag, DataSpecs, TagProp> {
  return new MemberImpl<DataSpecs, Tag, TagProp>(tag, data, tagProp) as any;
}

class MemberImpl<
  Config,
  Tag extends keyof Config = keyof Config,
  TagProp extends string = "tag",
> {
  [key: string]: any;

  constructor(
    tag: Tag,
    public data: Config[Tag],
    tagProp: TagProp = "tag" as TagProp,
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
  match<A>(casesObj: MatchCases<Config, A, boolean>, exhaustive?: boolean): any {
    const tag = this.getTag();
    const data = this.data;
    if (exhaustive === false) {
      const fallback = (casesObj as any)["_"];
      const fn = (casesObj as any)[tag] ?? fallback;
      return typeof fn === "function" ? fn(data) : undefined;
    }
    if (typeof (casesObj as any)[tag] === "function") {
      return (casesObj as any)[tag](data);
    }
    const fallback = (casesObj as any)["_"];
    if (typeof fallback === "function") {
      return fallback(data);
    }
    throw new Error(`Match did not handle key: '${tag}'`);
  }
}

// #region WIP

/**
 * ExtractMemberTypes maps each key in T to the type of its 'data' property, if present.
 * Useful for extracting the data types from a record of Matchbox members.
 *
 * @template T - The record of Matchbox members.
 */
type ExtractMemberTypes<T> = {
  [K in keyof T]: T[K] extends { data: infer D } ? D : never;
};

/**
 * ExtractSpec maps each key in T to a function type that returns the type of its 'data' property.
 * If the member is a function, preserves its parameters and return type.
 *
 * @template T - The record of Matchbox members.
 */
type ExtractSpec<T> = Simplify<{
  [K in keyof T]: T[K] extends (...args: infer P) => { data: infer D }
    ? (...args: P) => D
    : never;
}>;

/**
 * FactoryFromMembers creates a factory type from a record of member functions.
 * Each factory method constructs a Matchbox member from its arguments.
 *
 * @template TagProp - The property name used for the tag.
 * @template T - The record of member functions.
 */
type FactoryFromMembers<
  TagProp extends string,
  T extends Record<string, (...args: any[]) => any>,
> = {
  [K in keyof T]: (
    ...args: Parameters<T[K]>
  ) => MatchboxMember<K, ExtractSpec<T>, TagProp>;
};

/**
 * factoryFromMembers creates a factory object from a record of member functions.
 * Returns the input members typed as a factory for constructing Matchbox members.
 *
 * @param members - The record of member functions.
 * @returns A factory object for constructing Matchbox members.
 */
export function factoryFromMembers<
  TagProp extends string,
  T extends Record<string, (...args: any[]) => any>,
>(members: T) {
  return members as FactoryFromMembers<TagProp, T>;
}

// #endregion

/**
 * SpecRecord is a utility type for defining a record of tag-value pairs.
 * Used to specify the shape of the configuration for a Matchbox factory.
 *
 * @template Val - The value type for each tag.
 */
export type SpecRecord<Val = any> = {
  [k: string]: Val;
} & { _?: never };

/**
 * SpecFromStrings creates a spec record from an array of string tags.
 * Each tag maps to a function accepting data and returning any value.
 *
 * @template Config - The array of string tags.
 */
export type SpecFromStrings<Config> =
  Config extends ReadonlyArray<string>
    ? {
        [K in Config[number]]: (data: any) => any;
      }
    : never;
