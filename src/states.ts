import {
  matchboxFactory,
  MatchboxConfig,
  MatchboxFactory,
} from "./matchbox-factory";

export type StatesFactory<StatesConfig extends MatchboxConfig> =
  MatchboxFactory<StatesConfig, "name">;
export function defineStates<StatesConfig extends MatchboxConfig>(
  config: StatesConfig,
) {
  return matchboxFactory(config, "name");
}
