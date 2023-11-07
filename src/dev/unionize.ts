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
  : (value?: SpecRecord[Tag]) => UnionMember<SpecRecord, Tag, TagProp, ValProp>;

type UnionMember<
  SpecRecord,
  Tag extends keyof SpecRecord,
  TagProp extends string,
  ValProp extends string,
> = ((SpecRecord[Tag] extends (...args: any[]) => any
  ? { [_ in ValProp]: ReturnType<SpecRecord[Tag]> }
  : { [_ in ValProp]: SpecRecord[Tag] }) & { [_ in TagProp]: Tag }) &
  UnionMemberExtensions<SpecRecord, TagProp, ValProp>;

interface UnionMemberExtensions<
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
  <A>(
    cases: MatchCases<
      MemberValueRecord<SpecRecord>,
      MemberValueRecord<SpecRecord>,
      A
    >,
  ): (cases: SpecRecord[keyof SpecRecord]) => A;
}

type MemberValueRecord<SpecRecord> = {
  [T in keyof SpecRecord]: SpecRecord[T] extends (...args: any[]) => any
    ? ReturnType<SpecRecord[T]>
    : SpecRecord[T];
};

export type Cases<Record, A> = { [T in keyof Record]: (value: Record[T]) => A };

export type MatchCases<Record, Union, A> =
  | (Cases<Record, A> & NoDefaultProp)
  | (Partial<Cases<Record, A>> & { default: (variant: Union) => A });

// Forbid usage of default property; reserved for pattern matching.
export interface NoDefaultProp {
  default?: never;
}

// type FactoryMemberRecord<SpecRecord, TagProp extends string, ValProp extends string> = {
//   [Tag in keyof SpecRecord]:
//     FactoryMember<SpecRecord, Tag, TagProp, ValProp>
// };

// // usage

type F = FunctionFrom<(x: number, y: string) => { a: string }>;
type P = Parameters<F>;
const config = {
  Object: { hello: "world" },
  Function: (x: number, y: string) => ({ x }),
} as const;
type C = typeof config;
type X = UnionFactory<C>;
const x: X = {} as any;
const y = x.Object({ hello: "world" });
const z = x.Function(1, "2");
z.tag = "Function";
const { hello } = z.as("Object").data;

type Item = ReturnType<X[keyof X]>;

const item: Item = {} as any;
item.match({ Function: (x) => false, default: () => true });
if (item.is("Function")) {
  item.data.x = 123;
  item.tag = "Function";
}

if (item.tag === "Function") {
  item.data.x = 123;
}

type ValueMap = MemberValueRecord<C>;
// type MemberMap = FactoryMemberRecord<C, 'tag', 'data'>

const r = z.match({
  Function: (x) => x.x,
  default() {
    return undefined;
  },
});
