import { matchboxFactory, UnionSpec, UnionFactory } from "./matchbox";

export type StatesMatchboxFactory<StatesConfig extends UnionSpec> =
  UnionFactory<StatesConfig, "key">;

// export type MatchboxFromStatesFactory<
//   States extends StatesMatchboxFactory<any>,
//   K extends keyof States = keyof States,
// > = MatchboxFromFactory<States, K>;

export function defineStates<Config extends UnionSpec>(config: Config) {
  return matchboxFactory(config, "key");
}
