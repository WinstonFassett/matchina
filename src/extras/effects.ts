import {
  StateFromFactory,
  StateMachine,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import {
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFromConfig,
  MatchboxFromFactory,
  Matchers,
  NonExhaustiveMatchers,
  matchboxFactory,
} from "../matchbox";

import { onUpdate } from "./on-update";

export type AnyEffect = MatchboxFromConfig<any, "effect">;

export function defineEffects<EffectsConfig extends MatchboxConfig>(
  config: EffectsConfig,
) {
  return matchboxFactory(config, "effect");
}
export function bindEffects<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  EffectsConfig extends MatchboxConfig,
  Effects extends MatchboxFactory<EffectsConfig, "effect">,
  Exhaustive extends boolean = true,
>(
  machine: StateMachine<States, Transitions>,
  getEffects: (
    state: StateFromFactory<States>,
  ) => MatchboxFromFactory<Effects>[] | undefined,
  matchers: Exhaustive extends true
    ? Matchers<EffectsConfig>
    : NonExhaustiveMatchers<EffectsConfig>,
  exhaustive = false,
) {
  return onUpdate(machine, (commit, updater) => {
    commit((current) => {
      const initial = current;
      const updated = updater(current);
      if (initial.to !== updated.to) {
        const effects = getEffects(updated.to);
        handleEffects(effects, matchers, exhaustive);
      }
      return updated;
    });
  });
}
function handleEffects<Exhaustive extends boolean = true>(
  effects: undefined | AnyEffect[],
  matchers: Exhaustive extends true
    ? Matchers<any>
    : NonExhaustiveMatchers<any>,
  exhaustive = false,
) {
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    effect.match(matchers, exhaustive);
  }
}
