import { onUpdate } from "./on-update";
import { AnyMachine } from "./types";
import {
  Matchers,
  UnionConfigMember,
  UnionDataFactory,
  unionize,
} from "./unionize";

export type Effect = UnionConfigMember<any, "effect">;

export function createEffects(config: UnionDataFactory) {
  return unionize(config, "effect");
}
export function runEffectsOnUpdate(
  machine: AnyMachine,
  matchers: Matchers<any>,
) {
  onUpdate(machine, (commit, updater) => {
    commit((ev) => {
      const initial = ev;
      const updated = updater(ev);
      if (initial.to !== updated.to) {
        handleEffects(updated.to.data.effects, matchers);
      }
      return updated;
    });
  });
}
function handleEffects(effects: undefined | Effect[], matchers: Matchers<any>) {
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    effect.match(matchers);
  }
}
