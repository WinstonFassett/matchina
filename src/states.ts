import { matchboxFactory, MatchboxConfig, UnionFactory } from "./matchbox";

export type StatesMatchboxFactory<
  StatesConfig extends MatchboxConfig = MatchboxConfig,
> = UnionFactory<StatesConfig, "key">;

// export type MatchboxFromStatesFactory<
//   States extends StatesMatchboxFactory<any>,
//   K extends keyof States = keyof States,
// > = MatchboxFromFactory<States, K>;

export function defineStates<Config extends MatchboxConfig>(config: Config) {
  return matchboxFactory(config, "key");
}
