import { MatchboxMember, matchboxFactory } from "../matchbox-factory";
import { TaggedTypes } from "../tagged-types";
import { MatchCases } from "../match-case";

export type AnyEffect = MatchboxMember<any, any, "effect">;

export function defineEffects<EffectsConfig extends TaggedTypes>(
  config: EffectsConfig,
) {
  return matchboxFactory(config, "effect");
}
export function handleEffects<
  EffectsConfig extends TaggedTypes,
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
