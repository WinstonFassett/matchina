/**
 * TagDataCreators defines the shape of a factory object, mapping string keys (tags) to constructor functions.
 */
interface TagDataCreators {
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
  F extends TagDataCreators,
  D,
  K extends string & keyof F = string & keyof F
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
type MatchboxInstance<
  TagProp extends string,
  Tag extends string,
  Data
> = {
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
  F extends TagDataCreators
> {
  is: <K extends keyof F>(key: K) => this is Matchbox<TagProp, F, K>;
  as: <K extends keyof F>(key: K) => Matchbox<TagProp, F, K>;
  match: <A, Exhaustive extends boolean = true>(
    cases: {
      [K in keyof F]: (data: ReturnType<F[K]>) => A;
    },
    exhaustive?: Exhaustive
  ) => A;
}
/**
 * MatchboxFactory is the main output type for matchboxFactory.
 * It maps each tag in DataSpecs to a constructor function for its variant.
 * If the spec is a function, the constructor accepts its arguments; otherwise, it returns the variant with the value.
 */

export type MatchboxFactory<DataSpecs, TagProp extends string = "tag"> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: infer P) => infer _R ? (...args: P) => MatchboxMember<T, DataSpecs, TagProp> : () => MatchboxMember<T, DataSpecs, TagProp>;
};
/**
 * MatchboxMember creates the type for a single Matchbox variant instance from its data specification.
 * Includes the data, tag property, and member extension methods (is, as, match).
 */

export type MatchboxMember<
  Tag extends keyof DataSpecs,
  DataSpecs,
  TagProp extends string
> = ((DataSpecs[Tag] extends (...args: any[]) => any ? { data: ReturnType<DataSpecs[Tag]>; } : { data: DataSpecs[Tag]; }) & {
  [_ in TagProp]: Tag;
}) &
  MatchboxMemberApi<DataSpecs, TagProp>;
/**
 * Add conditional type for match cases to support exhaustiveness and fallback (_)
 * - _ is always allowed
 * - If _ is present, all tag cases become optional (exhaustiveness is satisfied)
 * - If _ is not present and exhaustive is true, all tags are required
 */
export type MatchCases<DataSpecs, A, Exhaustive extends boolean = true> =
  // If _ is present, all tags are optional (exhaustiveness is satisfied)
  (Partial<{
    [K in keyof DataSpecs]: (data: MatchboxData<DataSpecs>[K]) => A;
  }> & { _?: (...args: any[]) => A; })
  // Otherwise, if exhaustive, all tags are required
  |

  (Exhaustive extends true ? {
    [K in keyof DataSpecs]: (data: MatchboxData<DataSpecs>[K]) => A;
  } : Partial<{
    [K in keyof DataSpecs]: (data: MatchboxData<DataSpecs>[K]) => A;
  }>);
/**
 * MatchboxMemberApi provides type-safe methods for working with a Matchbox member:
 * - is: Type predicate for narrowing to a specific variant.
 * - as: Casts to a specific variant, throws if the tag does not match.
 * - match: Pattern matching for variant data.
 *
 * The match method is defined inline for clarity and simplicity.
 */

export interface MatchboxMemberApi<DataSpecs, TagProp extends string> {
  is: <T extends keyof DataSpecs>(
    key: T
  ) => this is MatchboxMember<T, DataSpecs, TagProp>;
  as: <T extends keyof DataSpecs>(
    key: T
  ) => MatchboxMember<T, DataSpecs, TagProp>;
  match<A>(cases: MatchCases<DataSpecs, A, true>, exhaustive?: boolean): A;
  match<A>(cases: MatchCases<DataSpecs, A, false>, exhaustive: boolean): A;
}
/**
 * MatchboxData maps each tag in DataSpecs to its corresponding value type.
 * If the spec is a function, uses its return type; otherwise, uses the value type directly.
 *
 * Used for pattern matching and type inference in MatchboxMember and related APIs.
 */
type MatchboxData<DataSpecs> = {
  [T in keyof DataSpecs]: DataSpecs[T] extends (...args: any[]) => any ? ReturnType<DataSpecs[T]> : DataSpecs[T];
};/**
 * TaggedTypes is a utility type for defining a record of tag-value pairs.
 * Used to specify the shape of the configuration for a Matchbox factory.
 *
 * @template T - The value type for each tag.
 */

export type TaggedTypes<T = any> = {
  [k: string]: T;
} & { _?: never; };

