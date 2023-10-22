import { Expand } from "./types";

// #region Config
export type MatchboxConfig = {
  [key: string | number | symbol]: MatchboxSpec;
};

export type MatchboxSpec = ((...args: any[]) => any) | undefined | any;
// #endregion

// #region Matchbox
type MatchboxCreator<B extends MatchboxSpec> = B extends (...args: any[]) => any
  ? B
  : B extends undefined
  ? () => object
  : () => B;

export type MatchboxConfigValues<Config extends MatchboxConfig> = {
  [BoxKey in keyof Config]: MatchboxCreator<Config[BoxKey]> extends (
    ...args: any
  ) => infer R
    ? R
    : never;
};
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
    ): M[keyof M] extends (...args: any) => infer R ? R : never;
  } & {
    [K in TagKey]: string;
  }
>;
class MatchboxImpl<
  Config extends MatchboxConfig,
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
// #endregion

// #region Matchbox Factory
export type MatchboxFactory<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
> = {
  [BoxKey in keyof Config]: MatchboxCreator<Config[BoxKey]> extends (
    ...args: any[]
  ) => any
    ? (
        ...args: Parameters<MatchboxCreator<Config[BoxKey]>>
      ) => Matchbox<Config, TagKey, BoxKey>
    : never;
};

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
// #endregion

// #region  Matchers
export type ExhaustiveMatchers<Config extends MatchboxConfig> = {
  [BoxKey in keyof MatchboxConfigValues<Config>]: MatchboxConfigValues<Config>[BoxKey] extends undefined
    ? () => any
    : (data: MatchboxConfigValues<Config>[BoxKey]) => any;
};

type UNDERSCORE_REQUIRED_when_all_cases_are_not_provided<
  Config extends MatchboxConfig,
> = Partial<ExhaustiveMatchers<Config>> & { _: (data: any) => any };

export type Matchers<Config extends MatchboxConfig> =
  | ExhaustiveMatchers<Config>
  | UNDERSCORE_REQUIRED_when_all_cases_are_not_provided<Config>;

// #endregion

// #region Helpers
export type MatchboxFactoryValues<Config extends MatchboxFactory<any, any>> = {
  [BoxKey in keyof Config]: ReturnType<Config[BoxKey]>;
};

export type MatchboxFromConfig<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
> = Matchbox<Config, TagKey> & { [K in TagKey]: string };

export type MatchboxFromFactory<
  F extends MatchboxFactory<any, any>,
  K extends keyof F = keyof F,
> = ReturnType<F[K]>;
// #endregion
