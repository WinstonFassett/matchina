// export type Spec = ((...args: any[]) => any) | any;
// export type Specs = Record<string, Spec>;

export type UnionFactory<Specs, TagProp extends string = "tag"> = Creators<
  Specs,
  TagProp
>;

export type MatchboxFactory<
  Specs,
  TagProp extends string = "tag",
> = UnionFactory<Specs, TagProp>;

export type Creators<Specs, TagProp extends string> = {
  [T in keyof Specs]: MemberCreate<T, Specs, TagProp>;
};

export type MemberCreate<
  Tag extends keyof Specs,
  Specs,
  TagProp extends string,
> = Specs[Tag] extends (...args: infer P) => infer R
  ? (...args: P) => Member<Tag, Specs, TagProp>
  : () // value?: Specs[Tag]
    => Member<Tag, Specs, TagProp>;

export type Member<
  Tag extends keyof Specs,
  Specs,
  TagProp extends string,
> = ((Specs[Tag] extends (...args: any[]) => any
  ? { data: ReturnType<Specs[Tag]> }
  : { data: Specs[Tag] }) & { [_ in TagProp]: Tag }) &
  MemberExtensions<Specs, TagProp>;

export interface MemberExtensions<Specs, TagProp extends string> {
  is: <T extends keyof Specs>(key: T) => this is Member<T, Specs, TagProp>;
  as: <T extends keyof Specs>(key: T) => Member<T, Specs, TagProp>;
  match: Match<Specs>;
}

interface Match<Specs> {
  <A, Exhaustive extends boolean = true>(
    cases: MatchCases<MemberData<Specs>, MemberData<Specs>, A, Exhaustive>,
    exhaustive?: Exhaustive,
  ): A;
}

export type MemberData<Specs> = {
  [T in keyof Specs]: Specs[T] extends (...args: any[]) => any
    ? ReturnType<Specs[T]>
    : Specs[T];
};

export type Cases<Record, A> = { [T in keyof Record]: (value: Record[T]) => A };

type PartialCases<Record, A, Union> = Partial<Cases<Record, A>> & {
  _: (variant: Union) => A;
};

type AnyCases<Record, A, Union> = Partial<
  Cases<Record, A> & {
    _: (variant: Union) => A;
  }
>;

export type MatchCases<
  Record,
  Union,
  A,
  Exhaustive extends boolean = true,
> = Exhaustive extends true
  ? (Cases<Record, A> & { _?: never }) | PartialCases<Record, A, Union>
  : AnyCases<Record, A, Union>;

export type UnionSpec<Val = any> = {
  [k: string]: Val;
} & { _?: never };

export type MemberOf<
  Factory extends UnionFactory<any, any>,
  Key extends keyof Factory = keyof Factory,
> = ReturnType<Factory[Key]>;

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @param specs A record mapping tags to value types. The actual values of the record don't
 * matter; they're just used in the types of the resulting tagged union. See `ofType`.
 * @param config An optional config object. By default tag='tag' and value is merged into object itself
 * @param config.tag An optional custom name for the tag property of the union.
 * @param config.value An optional custom name for the value property of the union. If not specified,
 * the value must be a dictionary type.
 */
export function matchboxFactory<
  Config extends UnionSpec,
  TagProp extends string = "tag",
>(config: Config, tagKey = "tag" as TagProp): UnionFactory<Config, TagProp> {
  const createObj: any = {};
  for (const tag in config) {
    const spec = config[tag];
    createObj[tag] = (...args: any) => {
      return matchbox<Config, any, TagProp>(
        tag,
        typeof spec === "function" ? spec(...args) : spec,
        tagKey,
      );
    };
  }
  return createObj;
}

export function matchbox<
  Config,
  Tag extends keyof Config,
  TagProp extends string = "tag",
>(
  tag: Tag,
  data: any,
  tagProp: TagProp = "tag" as TagProp,
): Member<Tag, Config, TagProp> {
  return new MemberImpl<Config, Tag, TagProp>(tag, data, tagProp) as any;
}

class MemberImpl<
  Config,
  Tag extends keyof Config = keyof Config,
  TagProp extends string = "tag",
> {
  // implements UnionMember<Tag, Config, TagKey>
  [key: string]: any;

  constructor(
    tag: Tag,
    value: Config[Tag],
    public tagProp: TagProp = "tag" as TagProp,
  ) {
    this.tagProp = tagProp;
    Object.assign(this, { [tagProp]: tag, tagKey: tagProp, data: value });
  }

  as(expectedTag: keyof Config) {
    if (!this.is(expectedTag)) {
      const tag = this[this.tagProp];
      throw new Error(
        `Attempted to cast ${this[this.tagProp]} as ${expectedTag.toString()}`,
      );
    }
    return this;
  }

  is(tag: keyof Config) {
    return this[this.tagProp] === tag;
  }

  match<A>(
    casesObj: MatchCases<MemberData<Config>, MemberData<Config>, A>,
    exhaustive = true,
  ): any {
    const { tagProp, DataProp: dataProp } = this;
    const tag = this[tagProp];
    const data = this[dataProp];
    const handler = (casesObj as any)[tag];
    if (handler) {
      return handler(data);
    } else if (casesObj._) {
      return casesObj._(data);
    } else if (exhaustive) {
      throw new Error(`Match did not handle ${tagProp}: '${tag.toString()}'`);
    }
  }
}
