import { onUpdate } from "./on-update";
import {
  unionize,
  Matchers,
  UnionDataFactory,
  UnionConfigMember,
} from "./unionize";
import { AnyMachine } from "./types";

export type Effect = UnionConfigMember<any, "effect">;

export function createEffects(config: UnionDataFactory) {
  return unionize(config, "effect");
}
export function runEffectsOnUpdate(
  machine: AnyMachine,
  matchers: Matchers<any>,
) {
  onUpdate(machine, (origUpdate, transition) => {
    let event: any;
    origUpdate((ev) => {
      event = transition(ev);
      return event;
    });
    handleEffects(event.to.effects, matchers);
    return event;
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
