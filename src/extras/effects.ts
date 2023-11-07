import {
  StateFromFactory,
  StateMachine,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import {
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFromFactory,
  MatchCases,
  UnionMember,
  matchboxFactory,
} from "../matchbox";

import { onUpdate } from "./on-update";

export type AnyEffect = UnionMember<any, any, "effect", any>;

export function defineEffects<EffectsConfig extends MatchboxConfig>(
  config: EffectsConfig,
) {
  return matchboxFactory(config, "effect");
}
export function bindEffects<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  EffectsConfig extends MatchboxConfig,
  Exhaustive extends boolean = false,
>(
  machine: StateMachine<States, Transitions>,
  getEffects: (
    state: StateFromFactory<States>,
  ) =>
    | MatchboxFromFactory<MatchboxFactory<EffectsConfig, "effect">>[]
    | undefined,
  matchers: MatchCases<
    EffectsConfig,
    MatchboxFromFactory<MatchboxFactory<EffectsConfig, "effect">>,
    any,
    Exhaustive
  >,
  exhaustive = false as Exhaustive,
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
function handleEffects<
  EffectsConfig extends MatchboxConfig,
  Exhaustive extends boolean = true,
>(
  effects: undefined | AnyEffect[],
  matchers: MatchCases<
    EffectsConfig,
    MatchboxFromFactory<MatchboxFactory<EffectsConfig, "effect">>,
    any,
    Exhaustive
  >,
  exhaustive = false as Exhaustive,
) {
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    effect.match(matchers as any, exhaustive);
  }
}
