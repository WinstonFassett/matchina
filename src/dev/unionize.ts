
export type Unionized<Record, TaggedRecord, TagProp extends string> = UnionMeta<
  Record,
  TaggedRecord
> &
  Creators<Record, TaggedRecord, TagProp> &
  UnionExtensions<Record, TaggedRecord>;

export interface UnionMeta<Record, TaggedRecord> {
  _TaggedRecord: TaggedRecord;
  _Tags: keyof TaggedRecord;
  _Record: Record;
  _Union: TaggedRecord[keyof TaggedRecord];
}
export interface UnionExtensions<Record, TaggedRecord> {
  transform: Transform<Record, TaggedRecord[keyof TaggedRecord]>;
}

// export interface MemberExtensions<Record, TaggedRecord> {
//   is: <T extends keyof TaggedRecord>(key: keyof TaggedRecord) => this is TaggedRecord[T];
//   as: <T extends keyof TaggedRecord>(key: T) => TaggedRecord[T];
//   match: Match<Record, TaggedRecord[keyof TaggedRecord]>;
//   // transform: Transform<Record, TaggedRecord[keyof TaggedRecord]>;
// }

/*
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 * @param record A record mapping tags to value types. The actual values of the record don't
 * matter; 
 * 
 * Type below needs some work
 * Assume each value is a function or object, and we will run it through FunctionFrom<T>
 * And the UnionFactory should return a function with the parameters of that function
 * and returning the tagged record for that key, enhanced with a data property that
 * is the return value of the original function (or the plain value if it is not a function)
 * 
 * 
 */
// export type UnionFactory<Def, TagProp extends string = 'tag', ValProp extends string = 'data'> = {
//   [Tag in keyof Def]: (...args: Parameters<FunctionFrom<Def[Tag]>>)
//     =>       
//       // TaggedRecord[keyof TaggedRecord] &
//       { data: ReturnType<FunctionFrom<Def[Tag]>> }
// };

// export type UnionizedFactory<Record, TaggedRecord, TagProp extends string> = UnionExtensions<
//   Record,
//   TaggedRecord
// > &
//   Creators<Record, TaggedRecord, TagProp> &
//   UnionExtensions<Record, TaggedRecord>;

// Derives its TaggedRecord from the values OR return types of the values
type UnionizedDataFactory<
  FunctionOrValueRecord,
  TagProp extends string = "tag",
  ValProp extends string = "data",
> = FactoryCreators<FunctionOrValueRecord, TagProp, ValProp>

type UnionizedDataFactoryCompat<
  FunctionOrValueRecord,
  TagProp extends string = "tag",
  ValProp extends string = "data",
> = Unionized<
  FactoryValueRecord<FunctionOrValueRecord>,
  FactoryMemberRecord<FunctionOrValueRecord, TagProp, ValProp>,
  TagProp
>;

type FactoryValueRecord<FunctionOrValueRecord> = {
  [T in keyof FunctionOrValueRecord]: 
    FunctionOrValueRecord[T] extends (...args: any[]) => any ? 
      ReturnType<FunctionOrValueRecord[T]> :
      FunctionOrValueRecord[T]
};

type FactoryMemberRecord<FunctionOrValueRecord, TagProp extends string, ValProp extends string> = {
  [Tag in keyof FunctionOrValueRecord]:     
    FactoryMember<FunctionOrValueRecord, Tag, TagProp, ValProp>
};

// Derives creators from the values OR return types of the values
// If value is function, creator uses its params
export type FactoryCreators<FunctionOrValueRecord, TagProp extends string, ValProp extends string> = {
  [T in keyof FunctionOrValueRecord]: 
    FactoryMemberCreate<FunctionOrValueRecord, T, TagProp, ValProp>
};

type FactoryMemberCreate<FunctionOrValueRecord, Tag extends keyof FunctionOrValueRecord, TagProp extends string, ValProp extends string> = 
FunctionOrValueRecord[Tag] extends (...args: infer P) => infer R ? 
  (...args: P) => FactoryMember<FunctionOrValueRecord, Tag, TagProp, ValProp> :
  (value?: FunctionOrValueRecord[Tag]) => FactoryMember<FunctionOrValueRecord, Tag, TagProp, ValProp>

type FactoryMember<
  FunctionOrValueRecord,
  Tag extends keyof FunctionOrValueRecord,
  TagProp extends string,
  ValProp extends string,
> = ((FunctionOrValueRecord[Tag] extends (...args: any[]) => any
  ? { [_ in ValProp]: ReturnType<FunctionOrValueRecord[Tag]> }
  : { [_ in ValProp]: FunctionOrValueRecord[Tag] }) & { [_ in TagProp]: Tag }) 
  & FactoryMemberExtensions<FunctionOrValueRecord, TagProp, ValProp>
  & {
    // TODO: Extend with member extensions
    /* 
      DISCUSSION: How do I extend this with the member extensions 
      that are aware of THIS type?
      I.e. I want to be able to do this:
      const x = UnionizedDataFactory<Config>;
      x.is('Object') // should return boolean
      x.as('Object') // should return Object
      x.match({ Object: (x) => x.hello }) // should return string
      x.transform({ Object: (x) => x.hello }) // should return string
      Does this require recursion to be aware of the factorymember type?
      Or can I do it with a generic type that is aware of the factorymember type?
      
     */
  }; 

interface FactoryMemberExtensions<
  FunctionOrValueRecord,
  TagProp extends string,
  ValProp extends string,  
> {
  is: <T extends keyof FunctionOrValueRecord>(key: T) => 
    this is FactoryMember<FunctionOrValueRecord, T, TagProp, ValProp>;
  as: <T extends keyof FunctionOrValueRecord>(key: T) =>
    FactoryMember<FunctionOrValueRecord, T, TagProp, ValProp>;
  match: FactoryValueMatch<FunctionOrValueRecord>;
  // Match<
  //   FactoryMemberRecord<FunctionOrValueRecord, TagProp, ValProp>,
  //   FactoryMember<
  //     FunctionOrValueRecord, 
  //     keyof FunctionOrValueRecord, 
  //     TagProp, 
  //     ValProp
  //   >
  // >;
  // is: (key: Tag) => boolean;
  // as: (key: Tag) => FunctionOrValueRecord[Tag];
  // match: (cases: any) => any;
  // transform: (cases: any) => any;
};

export interface FactoryValueMatch<FunctionOrValueRecord> {
  <A>(
    cases: MatchCases<
      FactoryValueRecord<FunctionOrValueRecord>,
      // FunctionOrValueRecord[keyof FunctionOrValueRecord],
      FactoryValueRecord<FunctionOrValueRecord>,
      A
    >,
  ): (variant: FunctionOrValueRecord[keyof FunctionOrValueRecord]) => A;
  // <A>(cases: MatchCases<Record, Union, A>): (variant: Union) => A;
  // <A>(variant: Union, cases: MatchCases<Record, Union, A>): A;
}

//  Unionized<
//   // here, FunctionOrValueRecord is a mapping to values OR parameterized creator functions
//   // Needs to be mapped to a Record of union data types, i.e. the return types
//   FunctionOrValueRecord, 
//   // Here FunctionOrValueRecord needs to be mapped to a Record of tagged union member types
//   SingleValueVariants<FunctionOrValueRecord, TagProp, ValProp>, 
//   TagProp
// >;

type F = FunctionFrom<(x: number, y: string) =>{ a: string }>
type P = Parameters<F>;
const config = {
  Object: { hello: 'world'},
  Function: (x: number, y: string) => ({ x }),  
} as const
type C = typeof config
type X = UnionizedDataFactory<C>;
const x: X = {} as any;
const y = x.Object({ hello: 'world' })
const z = x.Function(1, '2')
type ValueMap = FactoryValueRecord<C>
type MemberMap = FactoryMemberRecord<C, 'tag', 'data'>

const r = z.match({
  Function: (x) => x.x,
  default() { return undefined }
})

export type FactoryConfig = Record<string, FactoryItemSpec>;
export type FactoryItemSpec = ((...args: any[]) => any) | any;

export type FunctionFrom<T> = T extends (...args: any[]) => any ? T : T extends undefined ? () => T : (value?:T) => T;

export type TaggedRecordOf<U extends UnionMeta<any, any>> = U['_TaggedRecord'];
export type TagsOf<U extends UnionMeta<any, any>> = U['_Tags'];
export type RecordOf<U extends UnionMeta<any, any>> = U['_Record'];
export type UnionOf<U extends UnionMeta<any, any>> = U['_Union'];

export type Creators<Record, TaggedRecord, TagProp extends string> = {
  [T in keyof Record]: {} extends Required<Record[T]>
    ? ((value?: {}) => TaggedRecord[keyof TaggedRecord])
    : ((value: Record[T]) => TaggedRecord[keyof TaggedRecord])
};

export type Cases<Record, A> = { [T in keyof Record]: (value: Record[T]) => A };

export type MatchCases<Record, Union, A> =
  | Cases<Record, A> & NoDefaultProp
  | Partial<Cases<Record, A>> & { default: (variant: Union) => A };

export interface Match<Record, Union> {
  <A>(cases: MatchCases<Record, Union, A>): (variant: Union) => A;
  <A>(variant: Union, cases: MatchCases<Record, Union, A>): A;
}

export type TransformCases<Record, Union> = Partial<
  { [T in keyof Record]: (value: Record[T]) => Union }
>;

export interface Transform<Record, Union> {
  (cases: TransformCases<Record, Union>): (variant: Union) => Union;
  (variant: Union, cases: TransformCases<Record, Union>): Union;
}

export type MultiValueVariants<Record extends MultiValueRec<TagProp>, TagProp extends string> = {
  [T in keyof Record]: Record[T] extends { [_ in TagProp]: T } // does record already has tag with correct value?
    ? Record[T] // yes: return as is
    : { [_ in TagProp]: T } & Record[T] // no: decorate with tag
};

export type SingleValueVariants<
  Record extends SingleValueRec,
  TagProp extends string,
  ValProp extends string,
> = {
  [T in keyof Record]: { 
    [_ in TagProp]: T 
  } & { 
    [_ in ValProp]: Record[T] 
  };
};

// Forbid usage of default property; reserved for pattern matching.
export interface NoDefaultProp {
  default?: never;
}

export type SingleValueRec = NoDefaultRec<{} | null>;
export type MultiValueRec<TagProp extends string> = NoDefaultRec<
  { [tag: string]: any } & { [tag in TagProp]?: never }
>;
export type NoDefaultRec<Val> = {
  [k: string]: Val;
} & NoDefaultProp;

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @param record A record mapping tags to value types. The actual values of the record don't
 * matter; they're just used in the types of the resulting tagged union. See `ofType`.
 * @param config An optional config object. By default tag='tag' and value is merged into object itself
 * @param config.tag An optional custom name for the tag property of the union.
 * @param config.value An optional custom name for the value property of the union. If not specified,
 * the value must be a dictionary type.
 */

// export function unionize<
//   Record extends SingleValueRec,
//   ValProp extends string,
//   TagProp extends string = 'tag'
// >(
//   record: Record,
//   config: { value: ValProp; tag?: TagProp },
// ): Unionized<Record, SingleValueVariants<Record, TagProp, ValProp>, TagProp>;
// export function unionize<Record extends MultiValueRec<TagProp>, TagProp extends string = 'tag'>(
//   record: Record,
//   config?: { tag: TagProp },
// ): Unionized<Record, MultiValueVariants<Record, TagProp>, TagProp>;
// export function unionize<Record>(record: Record, config?: { value?: string; tag?: string }) {
//   const { value: valProp = undefined, tag: tagProp = 'tag' } = config || {};

//   const creators = {} as Creators<Record, any, any>;
//   for (const tag in record) {
//     creators[tag] = ((value: any = {}) =>
//       valProp ? { [tagProp]: tag, [valProp]: value } : { ...value, [tagProp]: tag }) as any;
//   }

//   const is = {} as Predicates<any>;
//   for (const tag in record) {
//     is[tag] = ((variant: any) => variant[tagProp] === tag) as any;
//   }

//   function evalMatch(variant: any, cases: any, defaultCase = cases.default): any {
//     const handler = cases[variant[tagProp]];
//     return handler ? handler(valProp ? variant[valProp] : variant) : defaultCase(variant);
//   }

//   const match = (first: any, second?: any) =>
//     second ? evalMatch(first, second) : (variant: any) => evalMatch(variant, first);

//   const identity = <A>(x: A) => x;
//   const transform = (first: any, second?: any) =>
//     second
//       ? evalMatch(first, second, identity)
//       : (variant: any) => evalMatch(variant, first, identity);

//   const as = {} as Casts<Record, any>;
//   for (const expectedTag in record) {
//     as[expectedTag] = match({
//       [expectedTag]: (x: any) => x,
//       default: (val: any) => {
//         throw new Error(`Attempted to cast ${val[tagProp]} as ${expectedTag}`);
//       },
//     });
//   }

//   return Object.assign(
//     {
//       is,
//       as,
//       match,
//       transform,
//       _Record: record,
//     },
//     creators,
//   );
// }

/**
 * Creates a pseudo-witness of a given type. That is, it pretends to return a value of
 * type `T` for any `T`, but it's really just returning `undefined`. This white lie
 * allows convenient expression of the value types in the record you pass to `unionize`.
 */
// export const ofType = <T>() => (undefined as any) as T;

// export default unionize;
