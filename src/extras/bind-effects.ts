import { MatchCases } from "../match-case";
import { SpecRecord, MatchboxMember } from "../matchbox-factory";
import { handleEffects, AnyEffect } from "./effects";

export function bindEffects<
  EffectsConfig extends SpecRecord,
  Exhaustive extends boolean = false,
>(
  machine: { effect: (val: any) => void },
  getEffects: (
    state: any,
  ) => AnyEffect[] | undefined,
  matchers: MatchCases<EffectsConfig, any, Exhaustive>,
  exhaustive = false as Exhaustive,
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
