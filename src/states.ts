import { matchbox, MatchboxConfig, MatchboxFactory } from "./unionize";

export type StatesFactory<StatesConfig extends MatchboxConfig> =
  MatchboxFactory<StatesConfig, "state">;
export function createStates<StatesConfig extends MatchboxConfig>(
  config: StatesConfig,
) {
  return matchbox(config, "state");
}
