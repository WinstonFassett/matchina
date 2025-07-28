import {
  MatchboxFactory,
  MatchboxMember,
  MatchCases,
  TaggedTypes,
} from "./matchbox-factory-types";

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
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
