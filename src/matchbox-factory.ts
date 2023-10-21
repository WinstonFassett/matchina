import { Expand } from "./types";

export type MatchboxConfig = {
  [key: string | number | symbol]: MatchboxSpec;
};

export type MatchboxSpec = ((...args: any[]) => any) | undefined | any;

type MatchboxCreator<B extends MatchboxSpec> = B extends (...args: any[]) => any
  ? B
  : B extends undefined
  ? () => object
  : () => B;

export type MatchboxConfigValues<Config extends MatchboxConfig> = {
  [Property in keyof Config]: MatchboxCreator<Config[Property]> extends (
    ...args: any
  ) => infer R
    ? R
    : never;
};

export type ExhaustiveMatchers<Config extends MatchboxConfig> = {
  [Property in keyof MatchboxConfigValues<Config>]: MatchboxConfigValues<Config>[Property] extends undefined
    ? () => any
    : (data: MatchboxConfigValues<Config>[Property]) => any;
};
type UNDERSCORE_REQUIRED_when_all_cases_are_not_provided<
  Config extends MatchboxConfig,
> = Partial<ExhaustiveMatchers<Config>> & { _: (data: any) => any };

export type Matchers<Config extends MatchboxConfig> =
  | ExhaustiveMatchers<Config>
  | UNDERSCORE_REQUIRED_when_all_cases_are_not_provided<Config>;

export type Matchbox<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
  K extends
    keyof MatchboxConfigValues<Config> = keyof MatchboxConfigValues<Config>,
  D extends MatchboxConfigValues<Config>[K] = MatchboxConfigValues<Config>[K],
> = Expand<
  {
    data: D;
    match<M extends Matchers<Config>>(
      casesObj: M,
    ): // any
    M[keyof M] extends (...args: any) => infer R ? R : never;
  } & {
    [K in TagKey]: string;
  }
>;

class MatchboxImpl<Config extends MatchboxConfig, TagKey extends string = "tag"> 
{
  data: any;
  [tagKey: string]: any;

  constructor(
    public tag: TagKey,
    data: any,
    tagKey: string,
  ) {
    Object.assign(this, { [tagKey]: tag, tagKey }, { data });
  }

  match(casesObj: Matchers<Config>): any {
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

export type MatchboxConfigMember<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
> = Matchbox<Config, TagKey> & { [K in TagKey]: string };

export type MatchboxFactory<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
> = {
  [Property in keyof Config]: MatchboxCreator<Config[Property]> extends (
    ...args: any[]
  ) => any
    ? (
        ...args: Parameters<MatchboxCreator<Config[Property]>>
      ) => Matchbox<Config, TagKey, Property>
    : never;
};

export type MatchboxFactoryValues<Config extends MatchboxFactory<any, any>> = {
  [Property in keyof Config]: ReturnType<Config[Property]>;
};

export type MatchboxFactoryMember<
  F extends MatchboxFactory<any, any>,
  K extends keyof F = keyof F,
> = ReturnType<F[K]>;

export function matchboxFactory<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
>(
  config: Config,
  tagKey: TagKey = "tag" as TagKey,
): MatchboxFactory<Config, TagKey> {
  const createObj: any = {};

  for (const tag of Object.keys(config)) {
    const value = config[tag];

    if (typeof value === "function") {
      createObj[tag] = (...args: any) => {
        const data = value(...args);
        return new MatchboxImpl(tag, data, tagKey);
      };
    } else if (typeof value === "object") {
      createObj[tag] = () => new MatchboxImpl(tag, value, tagKey);
    } else if (value === undefined) {
      createObj[tag] = () => new MatchboxImpl(tag, {}, tagKey);
    }
  }

  return createObj;
}
