import {
  MatchboxConfig,
  MatchboxFactory,
  MatchboxFactoryValues,
  MatchboxFromConfig,
  Matchers,
  matchboxFactory,
} from "../matchbox-factory";
import { StatesFactory } from "../states";
import { StateMachine, TransitionConfig } from "../types";
import { onUpdate } from "./on-update";

export type Effect = MatchboxFromConfig<any, "effect">;

export function createEffects(config: MatchboxConfig) {
  return matchboxFactory(config, "effect");
}
export function bindEffects<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  Effects extends MatchboxFactory<any, "effect">,
>(
  machine: StateMachine<States, Transitions>,
  getEffects: (state: ReturnType<States[keyof States]>) => Effect[] | undefined,
  matchers: Matchers<MatchboxFactoryValues<Effects>>,
) {
  return onUpdate(machine, (commit, updater) => {
    commit((current) => {
      const initial = current;
      const updated = updater(current);
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
