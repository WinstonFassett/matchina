export type UnionDataFactoryMember =
  | ((...args: any[]) => any)
  | undefined
  | any;

export type UnionDataFactory = { [key: string]: UnionDataFactoryMember };

// // Transform UnionDataConfigWithCreate to UnionDataFactory
// export type UnionDataFactoryFromConfig = {
//   [K in keyof UnionDataConfigWithCreate]: UnionDataConfigWithCreate[K]['create'];
// };

type Funcify<T> = T extends (...args: any[]) => any
  ? T
  : T extends undefined
  ? () => object
  : () => T;

export type UnionData<U extends UnionDataFactory> = {
  [Property in keyof U]: Funcify<U[Property]> extends (...args: any) => infer R
    ? R
    : never;
};

export type ExhaustiveMatchers<U extends UnionDataFactory> = {
  [Property in keyof UnionData<U>]: UnionData<U>[Property] extends undefined
    ? () => any
    : (data: UnionData<U>[Property]) => any;
};
type Match_MUST_handle_all_keys_OR_provide_a_default_handler_using_underscore<
  U extends UnionDataFactory,
> = Partial<ExhaustiveMatchers<U>> & { _: (data: any) => any };

export type Matchers<U extends UnionDataFactory> =
  | ExhaustiveMatchers<U>
  | Match_MUST_handle_all_keys_OR_provide_a_default_handler_using_underscore<U>;

export class UnionMemberImpl<
  U extends UnionDataFactory,
  TagKey extends string = "tag",
> {
  data: any;
  [tagKey: string]: any;

  constructor(
    public tag: TagKey,
    data: any,
    tagKey: string,
  ) {
    Object.assign(this, { [tagKey]: tag, tagKey }, { data });
  }

  match(casesObj: Matchers<U>): any {
    const handler = (casesObj as any)[this.tag];

    if (handler) {
      return handler(this.data);
    } else if (casesObj._) {
      return casesObj._(this.data);
    } else {
      throw new Error(`Match did not handle tag: '${this.tag}'`);
    }
  }
}

export type UnionConfigMember<
  U extends UnionDataFactory,
  TagKey extends string = "tag",
> = UnionMemberImpl<U, TagKey> & { [K in TagKey]: string };

export type UnionFactory<
  U extends UnionDataFactory,
  TagKey extends string = "tag",
> = {
  [Property in keyof U]: Funcify<U[Property]> extends (...args: any[]) => any
    ? (
        ...args: Parameters<Funcify<U[Property]>>
      ) => UnionConfigMember<U, TagKey>
    : never;
};

export function unionize<
  U extends UnionDataFactory,
  TagKey extends string = "tag",
>(config: U, tagKey: TagKey = "tag" as TagKey): UnionFactory<U, TagKey> {
  const createObj: any = {};

  for (const tag of Object.keys(config)) {
    const value = config[tag];

    if (typeof value === "function") {
      createObj[tag] = (...args: any) => {
        const data = value(...args);
        return new UnionMemberImpl(tag, data, tagKey);
      };
    } else if (value === undefined) {
      createObj[tag] = () => new UnionMemberImpl(tag, {}, tagKey);
    }
  }

  return createObj;
}
