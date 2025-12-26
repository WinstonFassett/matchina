import { eventApi } from "../factory-machine-event-api";
import { FactoryMachine } from "../factory-machine-types";

/**
 * Extension function that adds event API methods to a FactoryMachine.
 * Designed to work with the `.extend()` method for composable enhancements.
 * 
 * @param machine - The FactoryMachine instance to extend
 * @returns Object containing event sender methods
 * 
 * @example
 * ```typescript
 * import { createMachine, defineStates } from 'matchina';
 * import { withEventApi } from 'matchina/extras';
 * 
 * const states = defineStates({
 *   On: () => ({ label: "On" }),
 *   Off: () => ({ label: "Off" }),
 * });
 * 
 * const machine = createMachine(states, {
 *   On: { toggle: "Off" },
 *   Off: { toggle: "On" },
 * }, "Off");
 * 
 * const enhanced = machine.extend(withEventApi);
 * enhanced.toggle(); // Direct event method
 * enhanced.send("toggle"); // Original method still works
 * ```
 */
export function withEventApi<M extends FactoryMachine<any>>(machine: M) {
  return eventApi(machine);
}
