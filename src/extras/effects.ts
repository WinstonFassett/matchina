import { createSetup } from "../ext/setup";
import { MatchCases } from "../match-case-types";
import { matchboxFactory } from "../matchbox-factory";
import { TaggedTypes, MatchboxMember } from "../matchbox-factory-types";
import { effect } from "../state-machine-hooks";
import { Funcware } from "../function-types";

/**
 * @interface
 * EffectMatchbox is a type representing an effect matchbox member.
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
  matchers: MatchCases<EffectsConfig, any, Exhaustive>,
  exhaustive = false as Exhaustive
) {
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    effect.match(matchers as any, exhaustive);
  }
}

// export function effectHandler<
// EffectsConfig extends TaggedTypes,
//   Exhaustive extends boolean = true,
//   >
// (
//   selectEffects: (ev:E) => EffectsConfig,
//   matchers: MatchCases<EffectsConfig, any, Exhaustive>,
//   exhaustive = false as Exhaustive
// ): (ev: any) => void {
//   return (ev) => {
//     handleEffects(
//       ev.to.data.effects,
//       matchers,
//       exhaustive
//     );
//   };
// }

//   )

export interface EffectsProps<
  EffectsConfig extends TaggedTypes = TaggedTypes,
  Exhaustive extends boolean = true,
> {
  getEffects: (to: any) => undefined | EffectMatchbox[];
  matchers: MatchCases<EffectsConfig, any, Exhaustive>;
  exhaustive?: Exhaustive;
}

// export function handleEffectsFor<
//   EffectsConfig extends TaggedTypes = TaggedTypes,
//   Exhaustive extends boolean = true
// >(
//   machine: EffectMachine<EffectsConfig, Exhaustive>
// ): (ev: { to: any }) => void {
//   return (ev) => {
//     handleEffects(
//       machine.getEffects(ev.to),
//       machine.matchers,
//       machine.exhaustive
//     );
//   };
// }

// export function effectHandlers<
//   EffectsConfig extends TaggedTypes = TaggedTypes,
//   Exhaustive extends boolean = true
// >(
//   props: EffectsProps<EffectsConfig, Exhaustive>
// ): (ev: { to: any }) => void {
//   return (ev) => {
//     handleEffects(
//       props.getEffects(ev.to),
//       props.matchers,
//       props.exhaustive ?? false
//     );
//   };
// }

// export function mountEffects<
//   E,
//   EffectsConfig extends TaggedTypes = TaggedTypes,
//   Exhaustive extends boolean = true,
// >(
//   getEffects: (ev: E) => undefined | EffectMatchbox[],
//   matchers: MatchCases<EffectsConfig, E, Exhaustive>,
//   exhaustive = true as Exhaustive
// ) {
//   return createSetup(
//     effect((ev: E) => handleEffects(getEffects(ev), matchers, exhaustive))
//   )
// }
