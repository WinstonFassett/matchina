import {
  SpecRecord,
  MatchboxFactoryFromData,
  MemberOf,
  MemberFromDataSpecs,
  matchboxFactory,
} from "../matchbox";
import { MatchCases } from "../match-case";

export type AnyEffect = MemberFromDataSpecs<any, any, "effect">;

export function defineEffects<EffectsConfig extends SpecRecord>(
  config: EffectsConfig,
) {
  return matchboxFactory(config, "effect");
}
export function handleEffects<
  EffectsConfig extends SpecRecord,
  Exhaustive extends boolean = true,
>(
  effects: undefined | AnyEffect[],
  matchers: MatchCases<
    EffectsConfig,
    // MemberOf<MatchboxFactory<EffectsConfig, "effect">>,
    any,
    Exhaustive
  >,
  exhaustive = false as Exhaustive,
) {
  console.log("handleEffects", exhaustive, effects);
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    effect.match(matchers as any, exhaustive);
  }
}
