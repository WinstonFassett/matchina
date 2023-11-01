import {
  matchboxFactory,
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFromFactory,
} from "./matchbox";

/**
 * This is MyType description
 */
export type StatesFactory<StatesConfig extends MatchboxConfig = any> =
  MatchboxFactory<StatesConfig, "key">;

export type StateFromFactory<
  States extends StatesFactory,
  K extends keyof States = keyof States,
> = MatchboxFromFactory<States, K>;

export function defineStates<StatesConfig extends MatchboxConfig = any>(
  config: StatesConfig,
) {
  return matchboxFactory(config, "key");
}
