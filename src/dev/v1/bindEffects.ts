import {
  StateFromFactory,
  StateMachine,
  StatesFactory,
  TransitionConfig
} from "./machine-types";
import {
  UnionSpec,
  MatchboxFactory,
  MemberOf,
  MatchCases
} from "./matchbox";
import { handleEffects } from "../../extras/effects";

export function bindEffects<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  EffectsConfig extends UnionSpec,
  Exhaustive extends boolean = false
>(
  machine: StateMachine<Transitions, States>,
  getEffects: (
    state: StateFromFactory<States>
  ) => MemberOf<MatchboxFactory<EffectsConfig, "effect">>[] | undefined,
  matchers: MatchCases<
    EffectsConfig, MemberOf<MatchboxFactory<EffectsConfig, "effect">>, any, Exhaustive
  >,
  exhaustive = false as Exhaustive
) {
  const origUpdate = machine.update;
  machine.update = (updater) => {
    return origUpdate.call(machine, (current) => {
      const updated = updater(current);
      const effects = getEffects(updated.to);
      handleEffects(effects, matchers, exhaustive);
      return updated;
    });
  };
  return () => {
    machine.update = origUpdate;
  };
}
