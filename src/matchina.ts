import { zen } from "./extras/zen";
import { StateFactory } from "./factory-state";
import { createMachine } from "./factory-machine";
import {
  FactoryMachineContext,
  FactoryMachineTransitions,
} from "./factory-machine-types";
import { FactoryState } from "./factory-state";
import { KeysWithZeroRequiredArgs } from "./utility-types";

/**
 * Creates a strongly-typed state machine using the provided states, transitions, and initial state.
 * Wraps the machine with additional utilities via `zen` for ergonomic usage.
 *
 * @template SF - State factory type
 * @template TC - Transition table type
 * @template FC - Machine context type (defaults to `{ states: SF; transitions: TC }`)
 * @param states - State factory object defining all possible states.
 * @param transitions - Transition table mapping state keys to allowed transitions.
 * @param init - Initial state key or state object to start the machine.
 * @returns A state machine instance with enhanced ergonomics.
 *
 * Example:
 * ```ts
 * import { matchina, effect, guard, defineStates } from "matchina";
 *
 * const machine = matchina(
 *   defineStates({
 *     Idle: () => ({}),
 *     Active: (user: string, someCondition: boolean) => ({ user, someCondition }),
 *   }),
 *   {
 *     Idle: { activate: "Active" },
 *     Active: { deactivate: "Idle" },
 *   },
 *   "Idle"
 * );
 *
 * machine.setup(
 *   effect((ev) => {
 *     console.log("Effect triggered for event:", ev.type);
 *   }),
 *   guard((ev) => ev.to.data.someCondition)
 * );
 *
 * machine.activate("Alice", true); // Effect runs, guard checks someCondition
 * machine.deactivate();
 * ```
 *
 * @see {@link zen} - for ergonomic machine enhancement and setup support
 * @see {@link withApi} - for adding event API methods to machines
 *
 * @source
 * This function is a wrapper around `createMachine` that enhances the machine with additional utilities.
 * It provides a more ergonomic API for working with state machines in TypeScript, including event trigger methods
 * and a setup function for adding hooks and enhancers.
 */
export function matchina<
  SF extends StateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryState<FC["states"]>
) {
  return zen(createMachine(states, transitions, init));
}
