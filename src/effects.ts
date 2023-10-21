import { StateMachine, StateTransitionsConfig } from "./machine-types";
import { onUpdate } from "./on-update";
import { StateCreators } from "./states";
import {
  Matchers,
  UnionConfigMember,
  UnionDataFactory,
  UnionFactory,
  UnionFactoryData,
  unionize,
} from "./unionize";

export type Effect = UnionConfigMember<any, "effect">;

export function createEffects(config: UnionDataFactory) {
  return unionize(config, "effect");
}
export function runEffectsOnUpdate<
  StateFactory extends StateCreators<any>,
  TransitionConfig extends StateTransitionsConfig<StateFactory>,
  EffectFactory extends UnionFactory<any, "effect">,
>(
  machine: StateMachine<StateFactory, TransitionConfig>,
  getEffects: (
    state: ReturnType<StateFactory[keyof StateFactory]>,
  ) => Effect[] | undefined,
  matchers: Matchers<UnionFactoryData<EffectFactory>>,
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
