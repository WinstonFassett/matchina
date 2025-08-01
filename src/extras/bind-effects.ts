import { createDisposer, setup } from "../ext/setup";
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

// /**
//  * Mounts effects on the machine and sets up a handler to execute them.
//  * @template EffectsConfig - Type of the effects configuration
//  * @template Exhaustive - Whether to enforce exhaustive matching (default: false)
//  * @param machine - The machine instance to mount effects on
//  * @param getEffects - Function to retrieve the effects from the machine state
//  * @param matchers - Object mapping effect types to handler functions
//  * @param exhaustive - Whether to enforce exhaustive matching (default: false)
//  * @returns A function to unmount the effects when no longer needed
//  *
//  * This function sets up the machine to handle effects based on the provided matchers.
//  * It executes the effects once immediately after mounting.
//  * It returns a teardown function to clean up the effects when no longer needed.
//  * This is useful for integrating effects into a state machine workflow,
//  * allowing for side effects to be triggered based on state changes.
//  * Example usage:
//  * ```ts
//  * import { mountEffects } from "./bind-effects";
//  * const machine = createMachine(...);
//  * const teardown = mountEffects(
//  *   machine,
//  *  (state) => state.data.effects,
//  *  {
//  *    Notify: (msg) => console.log(msg
//  *   },
//  *  true
//  * );
//  * // Later, when you want to clean up:
//  * teardown();
//  * ```
//  * @source
//  */
// export function mountEffects<
//   EffectsConfig extends TaggedTypes,
//   Exhaustive extends boolean = false,
// >(
//   machine: { effect: (val: any) => void, getChange: () => any },
//   getEffects: (state: any) => EffectMatchbox[] | undefined,
//   matchers: MatchCases<EffectsConfig, any, Exhaustive>,
//   exhaustive = false as Exhaustive
// ) {
//   // setup future effects
//   const teardown = bindEffects(machine, getEffects, matchers, exhaustive)
//   // handle immediate effects
//   handleEffects(getEffects(machine.getChange()), matchers, exhaustive);
//   return teardown
// }
