import { TransitionRecord } from "./transition-machine";

/**
 * Returns the list of available action/event types for a given state.
 * Looks up the transition table for the specified state and returns its keys.
 *
 * @param transitions - The transition table mapping states to possible events/actions.
 * @param state - The current state key to query.
 * @returns An array of available action/event type strings for the state.
 */
export function getAvailableActions(
  transitions: TransitionRecord,
  state: string
) {
  const entry = transitions[state];
  return entry ? Object.keys(entry) : [];
}
