import { matchboxFactory, MatchboxConfig, MatchboxFactory } from "./matchbox-factory";

export type StatesFactory<StatesConfig extends MatchboxConfig> =
  MatchboxFactory<StatesConfig, "state">;
export function createStates<StatesConfig extends MatchboxConfig>(
  config: StatesConfig,
) {
  return matchboxFactory(config, "state");
}
