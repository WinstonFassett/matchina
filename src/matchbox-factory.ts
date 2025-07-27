import { match, MatchCases } from "./match-case";
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
  match: MatchMemberData<ExtractMemberTypes<F>>;
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
> = DataSpecs[Tag] extends (...args: infer P) => infer R
  ? (...args: P) => MemberFromDataSpecs<Tag, DataSpecs, TagProp>
  : () // value?: Specs[Tag]
    => MemberFromDataSpecs<Tag, DataSpecs, TagProp>;

    
/**
 * CreatorsFromDataSpecs maps each tag in DataSpecs to a constructor function for its variant.
 * Each constructor uses MemberCreateFromDataSpecs to create a Matchbox member for the tag.
 *
 * Used internally to build the set of variant constructors for a tagged union.
 * Most users will interact with this via matchboxFactory or UnionFromDataSpecs.
 */
export type CreatorsFromDataSpecs<DataSpecs, TagProp extends string> = {
  [T in keyof DataSpecs]: MemberCreateFromDataSpecs<T, DataSpecs, TagProp>;
};

/**
 * UnionFromDataSpecs is an alias for CreatorsFromDataSpecs, representing the full set of variant constructors.
 *
 * Used as the main output type for matchboxFactory, giving you a factory for all variants.
 */
export type UnionFromDataSpecs<
  DataSpecs,
  TagProp extends string = "tag",
> = CreatorsFromDataSpecs<DataSpecs, TagProp>;

/**
 * MatchboxFactoryFromData is an alias for UnionFromDataSpecs, representing the factory for creating Matchbox variants.
 *
 * Provided for semantic clarity; use when you want to emphasize the factory aspect in your code/docs.
 */
export type MatchboxFactoryFromData<
  DataSpecs,
  TagProp extends string = "tag",
> = UnionFromDataSpecs<DataSpecs, TagProp>;

/**
 * FactoryFromDataSpecs maps each tag in DataSpecs to a constructor function for its variant.
 * If the spec is a function, the constructor accepts its arguments; otherwise, it returns the variant with the value.
 *
 * Used to infer the type of the factory object returned by matchboxFactory.
 * This is the core type for building variant constructors from a spec record.
 */
export type FactoryFromDataSpecs<DataSpecs, TagProp extends string> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: infer P) => infer R
    ? (...args: P) => MemberFromDataSpecs<T, DataSpecs, TagProp>
    : () => MemberFromDataSpecs<T, DataSpecs, TagProp>;
};

/**
 * MemberFromDataSpecs creates the type for a single Matchbox member from its data specification.
 * Includes the data, tag property, and member extension methods (is, as, match).
 *
 * Used to represent the type of a single variant instance, including its API methods.
 * This is the main type returned by each variant constructor in the factory.
 */
export type MemberFromDataSpecs<
  Tag extends keyof DataSpecs,
  DataSpecs,
  TagProp extends string,
> = ((DataSpecs[Tag] extends (...args: any[]) => any
  ? { data: ReturnType<DataSpecs[Tag]> }
  : { data: DataSpecs[Tag] }) & { [_ in TagProp]: Tag }) &
  MemberExtensionsFromDataSpecs<DataSpecs, TagProp>;

/**
 * MemberExtensionsFromDataSpecs provides type-safe methods for working with a Matchbox member:
 * - is: Type predicate for narrowing to a specific variant.
 * - as: Casts to a specific variant, throws if the tag does not match.
 * - match: Pattern matching for variant data.
 *
 * Used to add ergonomic API methods to each variant instance, making them easy to work with.
 */
export interface MemberExtensionsFromDataSpecs<
  DataSpecs,
  TagProp extends string,
> {
  is: <T extends keyof DataSpecs>(
    key: T,
  ) => this is MemberFromDataSpecs<T, DataSpecs, TagProp>;
  as: <T extends keyof DataSpecs>(
    key: T,
  ) => MemberFromDataSpecs<T, DataSpecs, TagProp>;
  match: MatchMemberData<DataSpecs>;
}

/**
 * MatchMemberData provides pattern matching for variant data.
 * Accepts a cases object mapping tags to handler functions, and an optional exhaustiveness flag.
 *
 * Used to enable exhaustive and type-safe pattern matching on variant instances.
 * This is the main API for working with data in a tagged union.
 */
interface MatchMemberData<DataSpecs> {
  <A, Exhaustive extends boolean = true>(
    cases: MatchCases<MemberData<DataSpecs>, A, Exhaustive>,
    exhaustive?: Exhaustive,
  ): A;
}

/**
 * MemberData maps each tag in DataSpecs to its corresponding value type.
 * If the spec is a function, uses its return type; otherwise, uses the value type directly.
 *
 * @template DataSpecs - The record of data specifications.
 */
export type MemberData<DataSpecs> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: any[]) => any
    ? ReturnType<DataSpecs[T]>
    : DataSpecs[T];
};

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
 * MemberOf extracts the return type of a factory method for a given key.
 *
 * @template Factory - The factory shape.
 * @template Key - The key of the factory method.
 */
export type MemberOf<
  Factory extends FactoryShape,
  Key extends keyof Factory = keyof Factory,
> = ReturnType<Factory[Key]>;

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

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 */
export function matchboxFactory<
  Config extends SpecRecord | string,
  TagProp extends string = "tag",
  R = UnionFromDataSpecs<
    Config extends ReadonlyArray<string> ? SpecFromStrings<Config> : Config,
    TagProp
  >,
>(config: Config, tagProp = "tag" as TagProp): R {
  // : MatchboxFactory<TagProp>
  if (Array.isArray(config)) {
    // eslint-disable-next-line unicorn/no-array-reduce
    const spec = config.reduce((obj, tag) => {
      obj[tag] = (data: any) => data;
      return obj;
    }, {} as any);
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
): Matchbox<
  TagProp,
  FactoryFromDataSpecs<DataSpecs, TagProp>,
  DataSpecs[Tag]
> {
  return new MemberImpl<DataSpecs, Tag, TagProp>(tag, data, tagProp) as any;
}

/**
 * MemberImpl is the internal class used to implement Matchbox variant instances.
 * Provides type-safe methods for narrowing, casting, and pattern matching.
 */
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

  /**
   * Pattern matching for variant data.
   * @param casesObj - An object mapping tags to handler functions.
   * @param exhaustive - Whether to enforce exhaustiveness (default: true).
   */
  match<A>(
    casesObj: MatchCases<MemberData<Config>, A>,
    exhaustive = true,
  ): any {
    const tag = this.getTag();
    const data = this.data;
    return match(exhaustive, casesObj, tag, data);
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
  ) => MemberFromDataSpecs<K, ExtractSpec<T>, TagProp>;
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
