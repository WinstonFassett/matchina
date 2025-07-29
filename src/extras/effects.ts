import { MatchCases } from "../match-case-types";
import { matchboxFactory } from "../matchbox-factory";
import { TaggedTypes, MatchboxMember } from "../matchbox-factory-types";

/**
 * Type representing an effect matchbox member.
 * Used to group and handle effect-related logic in matchbox factories.
 */
export type EffectMatchbox = MatchboxMember<any, any, "effect">;

/**
 * Defines a set of effects using a tagged types configuration.
 *
 * Use cases:
 * - Grouping effect handlers for state machines or event systems
 * - Creating effect matchboxes for pattern matching
 *
 * @template EffectsConfig - The tagged types configuration for effects
 * @param config - Configuration object mapping effect tags to types
 * @returns A matchbox factory for the defined effects
 * @source
 */
export function defineEffects<EffectsConfig extends TaggedTypes>(
  config: EffectsConfig
) {
  return matchboxFactory(config, "effect");
}

/**
 * Handles an array of effect matchboxes by matching them against provided cases.
 *
 * Use cases:
 * - Executing effect handlers based on effect type
 * - Ensuring exhaustive handling of all effect cases
 *
 * @template EffectsConfig - The tagged types configuration for effects
 * @template Exhaustive - Whether exhaustive matching is required
 * @param effects - Array of effect matchboxes to handle
 * @param matchers - Object mapping effect types to handler functions
 * @param exhaustive - Whether to enforce exhaustive matching (default: false)
 */
export function handleEffects<
  EffectsConfig extends TaggedTypes,
  Exhaustive extends boolean = true,
>(
  effects: undefined | EffectMatchbox[],
  matchers: MatchCases<
    EffectsConfig,
    any,
    Exhaustive
  >,
  exhaustive = false as Exhaustive
) {
  if (!effects) return;
  for (const effect of effects) {
    effect.match(matchers as any, exhaustive);
  }
}
