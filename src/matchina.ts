import { assignEventApi } from "./extras/zen";
import { createMachine } from "./factory-machine";
import {
  FactoryMachineContext,
  FactoryMachineTransitions,
} from "./factory-machine-types";
import { FactoryKeyedState, KeyedStateFactory } from "./state-keyed";
import { KeysWithZeroRequiredArgs } from "./utility-types";

/**
 * Creates a strongly-typed state machine using the provided states, transitions, and initial state.
 * Wraps the machine with additional utilities via `assignEventApi` for ergonomic usage.
 *
 * @deprecated Use `createMachine(...).extend(withEventApi)` instead for tree-shakeable, 
 * composable machine creation. This function will be removed in a future version.
 * 
 * @example
 * ```typescript
 * // Instead of:
 * const machine = matchina(states, transitions, 'Idle');
 * 
 * // Use:
 * import { createMachine } from 'matchina';
 * import { withEventApi } from 'matchina/extras';
 * const machine = createMachine(states, transitions, 'Idle').extend(withEventApi);
 * ```
 *
 * @template SF - State factory type
 * @template TC - Transition table type
 * @template FC - Machine context type (defaults to `{ states: SF; transitions: TC }`)
 * @param states - State factory object defining all possible states.
 * @param transitions - Transition table mapping state keys to allowed transitions.
 * @param init - Initial state key or state object to start the machine.
 * @returns A state machine instance with enhanced ergonomics.
 *
 * @see {@link assignEventApi} - for ergonomic machine enhancement and setup support
 * @see {@link addEventApi} - for adding event API methods to machines
 *
 * @source
 * This function is a wrapper around `createMachine` that enhances the machine with additional utilities.
 * It provides a more ergonomic API for working with state machines in TypeScript, including event trigger methods
 * and a setup function for adding hooks and enhancers.
 */
export function matchina<
  SF extends KeyedStateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryKeyedState<FC["states"]>
) {
  return assignEventApi(createMachine(states, transitions, init));
}
