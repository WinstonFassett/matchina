import {
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFromFactory,
  MatchboxSpec,
  matchboxFactory,
} from "./matchbox";

/**
 * This is MyType description
 */
export type StatesFactory<
  StatesConfig extends MatchboxConfig = Record<any, MatchboxSpec>, // try string keys
> = MatchboxFactory<StatesConfig, "key">;

export type StateFromFactory<
  States extends StatesFactory,
  K extends keyof States = keyof States,
> = MatchboxFromFactory<States, K>;

export function defineStates<StatesConfig extends MatchboxConfig = any>(
  config: StatesConfig,
) {
  return matchboxFactory(config, "key");
}
