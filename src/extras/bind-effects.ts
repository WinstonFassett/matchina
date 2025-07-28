import { MatchCases } from "../match-case-types";
import { TaggedTypes } from "../matchbox-factory-types";
import { EffectMatchbox, handleEffects } from "./effects";

export function bindEffects<
  EffectsConfig extends TaggedTypes,
  Exhaustive extends boolean = false,
>(
  machine: { effect: (val: any) => void },
  getEffects: (state: any) => EffectMatchbox[] | undefined,
  matchers: MatchCases<EffectsConfig, any, Exhaustive>,
  exhaustive = false as Exhaustive
) {
  const origEffect = machine.effect;
  const machineEffects = origEffect.bind(machine);
  machine.effect = (ev) => {
    machineEffects(ev);
    handleEffects(getEffects(ev.to), matchers, exhaustive);
  };
  return () => {
    machine.effect = origEffect;
  };
}
