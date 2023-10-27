export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

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
export type NonExhaustiveMatchers<Config extends MatchboxConfig> = Partial<
  ExhaustiveMatchers<Config> & {
    _: (data: any) => any;
  }
>;

export type Matchbox<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
  K extends
    keyof MatchboxConfigValues<Config> = keyof MatchboxConfigValues<Config>,
  D extends MatchboxConfigValues<Config>[K] = MatchboxConfigValues<Config>[K],
> = Expand<
  {
    data: D;
    match<
      M extends Exhaustive extends false
        ? NonExhaustiveMatchers<Config>
        : Matchers<Config>,
      Exhaustive extends boolean = true,
    >(
      casesObj: M,
      exhaustive?: Exhaustive,
    ): M[keyof M] extends (...args: any) => infer R ? R : never;
  } & {
    [Key in TagKey as Extract<TagKey, string>]: Extract<K, string>;
  }
>;

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
> = Matchbox<Config, TagKey>;

export type MatchboxFromFactory<
  F extends MatchboxFactory<any, any>,
  K extends keyof F = keyof F,
> = ReturnType<F[K]>;
// #endregion
