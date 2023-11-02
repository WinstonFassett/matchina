import {
  matchboxFactory,
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFromFactory,
  MatchboxSpec,
} from "./matchbox";
import { UnknownRecord } from "./types";

/**
 * This is MyType description
 */
export type StatesFactory<
  StatesConfig extends MatchboxConfig = Record<any, MatchboxSpec>,
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
