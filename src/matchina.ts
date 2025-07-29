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
 * Usage:
 * ```ts
 * const machine = matchina(states, transitions, "Idle");
 * machine.send("executing");
 * ```
 * @source
 * This function is a wrapper around `createMachine` that enhances the machine with additional utilities.
 * It provides a more ergonomic API for working with state machines in TypeScript.
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
