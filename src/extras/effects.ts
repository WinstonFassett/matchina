import {
  StateFromFactory,
  StateMachine,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import {
  UnionSpec,
  MatchboxFactory,
  MemberOf,
  MatchCases,
  Member,
  matchboxFactory,
} from "../matchbox";

import { onUpdate } from "./on-update";

export type AnyEffect = Member<any, any, "effect", any>;

export function defineEffects<EffectsConfig extends UnionSpec>(
  config: EffectsConfig,
) {
  return matchboxFactory(config, "effect");
}
export function bindEffects<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  EffectsConfig extends UnionSpec,
  Exhaustive extends boolean = false,
>(
  machine: StateMachine<Transitions, States>,
  getEffects: (
    state: StateFromFactory<States>,
  ) => MemberOf<MatchboxFactory<EffectsConfig, "effect">>[] | undefined,
  matchers: MatchCases<
    EffectsConfig,
    MemberOf<MatchboxFactory<EffectsConfig, "effect">>,
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
  EffectsConfig extends UnionSpec,
  Exhaustive extends boolean = true,
>(
  effects: undefined | AnyEffect[],
  matchers: MatchCases<
    EffectsConfig,
    MemberOf<MatchboxFactory<EffectsConfig, "effect">>,
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
