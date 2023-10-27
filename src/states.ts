import { matchboxFactory, MatchboxConfig, MatchboxFactory } from "./matchbox";

export type StatesFactory<StatesConfig extends MatchboxConfig> =
  MatchboxFactory<StatesConfig, "key">;

export type StateFromFactory<
  States extends StatesFactory<any>,
  K extends keyof States = keyof States,
> = ReturnType<States[K]>;

export function defineStates<StatesConfig extends MatchboxConfig>(
  config: StatesConfig,
) {
  return matchboxFactory(config, "key");
}
