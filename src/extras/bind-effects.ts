import { setup } from "../ext/setup";
import { MatchCases } from "../match-case-types";
import { TaggedTypes } from "../matchbox-factory-types";
import { effect } from "../state-machine-hooks";
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
  return setup(machine)(
    effect((ev) => handleEffects(getEffects(ev.to), matchers, exhaustive))
  );
}
