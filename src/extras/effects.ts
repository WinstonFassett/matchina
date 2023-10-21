import { StateMachine, StateTransitionsConfig } from "../types";
import { StatesFactory } from "../states";
import {
  Matchers,
  MatchboxConfigMember,
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFactoryValues,
  matchboxFactory,
} from "../matchbox-factory";
import { onUpdate } from "./on-update";

export type Effect = MatchboxConfigMember<any, "effect">;

export function createEffects(config: MatchboxConfig) {
  return matchboxFactory(config, "effect");
}
export function runEffectsOnUpdate<
  StateFactory extends StatesFactory<any>,
  TransitionConfig extends StateTransitionsConfig<StateFactory>,
  EffectFactory extends MatchboxFactory<any, "effect">,
>(
  machine: StateMachine<StateFactory, TransitionConfig>,
  getEffects: (
    state: ReturnType<StateFactory[keyof StateFactory]>,
  ) => Effect[] | undefined,
  matchers: Matchers<MatchboxFactoryValues<EffectFactory>>,
) {
  return onUpdate(machine, (commit, updater) => {
    commit((ev) => {
      const initial = ev;
      const updated = updater(ev);
      if (initial.to !== updated.to) {
        const effects = getEffects(updated.to);
        handleEffects(effects, matchers);
      }
      return updated;
    });
  });
}
export function handleEffects(
  effects: undefined | Effect[],
  matchers: Matchers<any>,
) {
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    effect.match(matchers);
  }
}
