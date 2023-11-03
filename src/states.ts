import { matchboxFactory } from "./matchbox";
import {
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFromFactory,
  MatchboxSpec,
} from "./matchbox-types";

export type StatesMatchboxFactory<
  StatesConfig extends MatchboxConfig = Record<string, MatchboxSpec>,
> = MatchboxFactory<StatesConfig, "key">;

export type MatchboxFromStatesFactory<
  States extends StatesMatchboxFactory<any>,
  K extends keyof States = keyof States,
> = MatchboxFromFactory<States, K>;

export function defineStates<StatesConfig extends MatchboxConfig = any>(
  config: StatesConfig,
) {
  const factory = matchboxFactory(config, "key") as MatchboxFactory<
    StatesConfig,
    "key"
  >;
  return factory;
}
