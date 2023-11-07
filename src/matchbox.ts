// export type Spec = ((...args: any[]) => any) | any;
// export type FactoryConfig = Record<string, Spec>;
export type FunctionFrom<Spec> = Spec extends (...args: any[]) => any
  ? Spec
  : Spec extends undefined
  ? () => Spec
  : (value?: Spec) => Spec;

export type UnionFactory<
  SpecRecord,
  TagProp extends string = "tag",
  ValProp extends string = "data",
> = MemberCreators<SpecRecord, TagProp, ValProp>;

export type MatchboxFactory<
  SpecRecord,
  TagProp extends string = "tag",
  ValProp extends string = "data",
> = UnionFactory<SpecRecord, TagProp, ValProp>;

export type MemberCreators<
  SpecRecord,
  TagProp extends string,
  ValProp extends string,
> = {
  [T in keyof SpecRecord]: MemberCreate<SpecRecord, T, TagProp, ValProp>;
};

export type MemberCreate<
  SpecRecord,
  Tag extends keyof SpecRecord,
  TagProp extends string,
  ValProp extends string,
> = SpecRecord[Tag] extends (...args: infer P) => infer R
  ? (...args: P) => UnionMember<SpecRecord, Tag, TagProp, ValProp>
  : () // ...args:any[]
    // value?: SpecRecord[Tag]
    => UnionMember<SpecRecord, Tag, TagProp, ValProp>;

export type UnionMember<
  SpecRecord,
  Tag extends keyof SpecRecord,
  TagProp extends string,
  ValProp extends string,
> = ((SpecRecord[Tag] extends (...args: any[]) => any
  ? { [_ in ValProp]: ReturnType<SpecRecord[Tag]> }
  : { [_ in ValProp]: SpecRecord[Tag] }) & { [_ in TagProp]: Tag }) &
  MemberExtensions<SpecRecord, TagProp, ValProp>;

interface MemberExtensions<
  SpecRecord,
  TagProp extends string,
  ValProp extends string,
> {
  is: <T extends keyof SpecRecord>(
    key: T,
  ) => this is UnionMember<SpecRecord, T, TagProp, ValProp>;
  as: <T extends keyof SpecRecord>(
    key: T,
  ) => UnionMember<SpecRecord, T, TagProp, ValProp>;
  match: MemberValueMatch<SpecRecord>;
}

interface MemberValueMatch<SpecRecord> {
  <A, Exhaustive extends boolean = true>(
    cases: MatchCases<
      MemberValueRecord<SpecRecord>,
      MemberValueRecord<SpecRecord>,
      A,
      Exhaustive
    >,
    exhaustive?: Exhaustive,
  ): A;
}

export type MemberValueRecord<SpecRecord> = {
  [T in keyof SpecRecord]: SpecRecord[T] extends (...args: any[]) => any
    ? ReturnType<SpecRecord[T]>
    : SpecRecord[T];
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
  ? (Cases<Record, A> & NoDefaultProp) | PartialCases<Record, A, Union>
  : AnyCases<Record, A, Union>;

export type SingleValueRec = NoDefaultRec<any>;
export type MatchboxConfig = SingleValueRec;
export type NoDefaultRec<Val> = {
  [k: string]: Val;
} & NoDefaultProp;

// Forbid usage of default property; reserved for pattern matching.
export interface NoDefaultProp {
  _?: never;
}

// type MatchboxFromFactory<Factory, Key extends keyof Factory> =
//   Factory extends UnionFactory<
//     infer Config,
//     infer TagProp,
//     infer ValProp
//   >
//     ? UnionMember<Config, keyof Config, TagProp, ValProp>
//     : never;

type MemberFromFactory1<
  Factory,
  Key extends keyof Factory,
> = Factory extends UnionFactory<infer Config, infer TagProp, infer ValProp>
  ? Key extends keyof Config
    ? UnionMember<Config, Key, TagProp, ValProp>
    : never
  : never;

export type MatchboxFromFactory<
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
  Config extends MatchboxConfig,
  TagProp extends string = "tag",
  ValueProp extends string = "data",
>(
  config: Config,
  tagKey = "tag" as TagProp,
  valueKey = "data" as ValueProp,
): UnionFactory<Config, TagProp, ValueProp> {
  const createObj: any = {};
  for (const tag in config) {
    const spec = config[tag];
    createObj[tag] = (...args: any) => {
      return matchbox<Config, any, TagProp, ValueProp>(
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
  ValProp extends string = "data",
>(
  tag: Tag,
  data: any,
  tagProp: TagProp = "tag" as TagProp,
  valProp = "data" as ValProp,
): UnionMember<Config, Tag, TagProp, ValProp> {
  return new MemberImpl<Config, Tag, TagProp, ValProp>(
    tag,
    data,
    tagProp,
    valProp,
  ) as any;
}

class MemberImpl<
  Config,
  Tag extends keyof Config = keyof Config,
  TagProp extends string = "tag",
  ValProp extends string = "data",
> {
  // implements UnionMember<Config, Tag, TagKey, ValProp>
  [key: string]: any;

  constructor(
    tag: Tag,
    value: Config[Tag],
    public tagProp: TagProp = "tag" as TagProp,
    public valProp: ValProp = "data" as ValProp,
  ) {
    this.tagProp = tagProp;
    this.valProp = valProp;
    Object.assign(this, { [tagProp]: tag, tagKey: tagProp, [valProp]: value });
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
    casesObj: MatchCases<
      MemberValueRecord<Config>,
      MemberValueRecord<Config>,
      A
    >,
    exhaustive = true,
  ): any {
    const { tagProp, valProp: valueProp } = this;
    const tag = this[tagProp];
    const data = this[valueProp];
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
