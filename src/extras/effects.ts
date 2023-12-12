import {
  UnionSpec,
  MatchboxFactory,
  MemberOf,
  Member,
  matchboxFactory,
} from "../matchbox";
import { MatchCases } from "../match";

export type AnyEffect = Member<any, any, "effect">;

export function defineEffects<EffectsConfig extends UnionSpec>(
  config: EffectsConfig,
) {
  return matchboxFactory(config, "effect");
}
export function handleEffects<
  EffectsConfig extends UnionSpec,
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
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    effect.match(matchers as any, exhaustive);
  }
}
