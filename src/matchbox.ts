// export type Spec = ((...args: any[]) => any) | any;
// export type Specs = Record<string, Spec>;

export type UnionFactory<
  Specs,
  TagProp extends string = "tag",
  DataProp extends string = "data",
> = Creators<Specs, TagProp, DataProp>;

export type MatchboxFactory<
  Specs,
  TagProp extends string = "tag",
  DataProp extends string = "data",
> = UnionFactory<Specs, TagProp, DataProp>;

export type Creators<Specs, TagProp extends string, DataProp extends string> = {
  [T in keyof Specs]: MemberCreate<Specs, T, TagProp, DataProp>;
};

export type MemberCreate<
  Specs,
  Tag extends keyof Specs,
  TagProp extends string,
  DataProp extends string,
> = Specs[Tag] extends (...args: infer P) => infer R
  ? (...args: P) => Member<Specs, Tag, TagProp, DataProp>
  : () // value?: Specs[Tag]
    => Member<Specs, Tag, TagProp, DataProp>;

export type Member<
  Specs,
  Tag extends keyof Specs,
  TagProp extends string,
  DataProp extends string,
> = ((Specs[Tag] extends (...args: any[]) => any
  ? { [_ in DataProp]: ReturnType<Specs[Tag]> }
  : { [_ in DataProp]: Specs[Tag] }) & { [_ in TagProp]: Tag }) &
  MemberExtensions<Specs, TagProp, DataProp>;

export interface MemberExtensions<
  Specs,
  TagProp extends string,
  DataProp extends string,
> {
  is: <T extends keyof Specs>(
    key: T,
  ) => this is Member<Specs, T, TagProp, DataProp>;
  as: <T extends keyof Specs>(key: T) => Member<Specs, T, TagProp, DataProp>;
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
  Factory extends UnionFactory<any, any, any>,
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
  DataProp extends string = "data",
>(
  config: Config,
  tagKey = "tag" as TagProp,
  valueKey = "data" as DataProp,
): UnionFactory<Config, TagProp, DataProp> {
  const createObj: any = {};
  for (const tag in config) {
    const spec = config[tag];
    createObj[tag] = (...args: any) => {
      return matchbox<Config, any, TagProp, DataProp>(
        tag,
        typeof spec === "function" ? spec(...args) : spec,
        tagKey,
        valueKey,
      );
    };
  }
  return createObj;
}

export function matchbox<
  Config,
  Tag extends keyof Config,
  TagProp extends string = "tag",
  DataProp extends string = "data",
>(
  tag: Tag,
  data: any,
  tagProp: TagProp = "tag" as TagProp,
  DataProp = "data" as DataProp,
): Member<Config, Tag, TagProp, DataProp> {
  return new MemberImpl<Config, Tag, TagProp, DataProp>(
    tag,
    data,
    tagProp,
    DataProp,
  ) as any;
}

class MemberImpl<
  Config,
  Tag extends keyof Config = keyof Config,
  TagProp extends string = "tag",
  DataProp extends string = "data",
> {
  // implements UnionMember<Config, Tag, TagKey, DataProp>
  [key: string]: any;

  constructor(
    tag: Tag,
    value: Config[Tag],
    public tagProp: TagProp = "tag" as TagProp,
    public DataProp: DataProp = "data" as DataProp,
  ) {
    this.tagProp = tagProp;
    this.DataProp = DataProp;
    Object.assign(this, { [tagProp]: tag, tagKey: tagProp, [DataProp]: value });
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
