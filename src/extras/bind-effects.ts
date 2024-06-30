import { MatchCases } from "../match-case";
import { MatchboxFactoryFromData, MemberOf, SpecRecord } from "../matchbox";
import { handleEffects } from "./effects";

export function bindEffects<
  EffectsConfig extends SpecRecord,
  Exhaustive extends boolean = false,
>(
  machine: { effect: (val: any) => void },
  getEffects: (
    state: any,
  ) => MemberOf<MatchboxFactoryFromData<EffectsConfig, "effect">>[] | undefined,
  matchers: MatchCases<SpecRecord, any, Exhaustive>,
  exhaustive = false as Exhaustive,
) {
  const origEffect = machine.effect;
  const machineEffects = origEffect.bind(machine);
  machine.effect = (ev) => {
    // console.log('EFFECT!', ev)
    machineEffects(ev);
    handleEffects(getEffects(ev.to), matchers, exhaustive);
  };
  return () => {
    machine.effect = origEffect;
  };
}
