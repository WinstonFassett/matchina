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

    
export type CreatorsFromDataSpecs<DataSpecs, TagProp extends string> = {
  [T in keyof DataSpecs]: MemberCreateFromDataSpecs<T, DataSpecs, TagProp>;
};

export type UnionFromDataSpecs<
  DataSpecs,
  TagProp extends string = "tag",
> = CreatorsFromDataSpecs<DataSpecs, TagProp>;

export type MatchboxFactoryFromData<
  DataSpecs,
  TagProp extends string = "tag",
> = UnionFromDataSpecs<DataSpecs, TagProp>;


export type FactoryFromDataSpecs<DataSpecs, TagProp extends string> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: infer P) => infer R
    ? (...args: P) => MemberFromDataSpecs<T, DataSpecs, TagProp>
    : () => MemberFromDataSpecs<T, DataSpecs, TagProp>;
};

export type MemberFromDataSpecs<
  Tag extends keyof DataSpecs,
  DataSpecs,
  TagProp extends string,
> = ((DataSpecs[Tag] extends (...args: any[]) => any
  ? { data: ReturnType<DataSpecs[Tag]> }
  : { data: DataSpecs[Tag] }) & { [_ in TagProp]: Tag }) &
  MemberExtensionsFromDataSpecs<DataSpecs, TagProp>;

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

interface MatchMemberData<DataSpecs> {
  <A, Exhaustive extends boolean = true>(
    cases: MatchCases<MemberData<DataSpecs>, A, Exhaustive>,
    exhaustive?: Exhaustive,
  ): A;
}

export type MemberData<DataSpecs> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: any[]) => any
    ? ReturnType<DataSpecs[T]>
    : DataSpecs[T];
};

export type SpecRecord<Val = any> = {
  [k: string]: Val;
} & { _?: never };

export type MemberOf<
  Factory extends FactoryShape,
  Key extends keyof Factory = keyof Factory,
> = ReturnType<Factory[Key]>;

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

  as(expectedTag: keyof Config) {
    if (!this.is(expectedTag)) {
      const tag = this.getTag();
      throw new Error(`Attempted to cast ${tag} as ${expectedTag.toString()}`);
    }
    return this;
  }

  is(tag: keyof Config) {
    return this.getTag() === tag;
  }

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

type ExtractMemberTypes<T> = {
  [K in keyof T]: T[K] extends { data: infer D } ? D : never;
};

type ExtractSpec<T> = Simplify<{
  [K in keyof T]: T[K] extends (...args: infer P) => { data: infer D }
    ? (...args: P) => D
    : never;
}>;

type FactoryFromMembers<
  TagProp extends string,
  T extends Record<string, (...args: any[]) => any>,
> = {
  [K in keyof T]: (
    ...args: Parameters<T[K]>
  ) => MemberFromDataSpecs<K, ExtractSpec<T>, TagProp>;
};

export function factoryFromMembers<
  TagProp extends string,
  T extends Record<string, (...args: any[]) => any>,
>(members: T) {
  return members as FactoryFromMembers<TagProp, T>;
}

// #endregion
