/**
 * Returns the list of available action/event types for a given state.
 * Looks up the transition table for the specified state and returns its keys.
 *
 * @param transitions - The transition table mapping states to possible events/actions.
 * @param state - The current state key to query.
 * @returns An array of available action/event type strings for the state.
 * @source
 * This function is useful for determining what actions can be performed in a given state,
 * allowing for dynamic UI updates or validation in applications using state machines.
 * It retrieves the keys of the transition record for the specified state, which represent the available actions
 * that can be triggered from that state.
 */
export function getAvailableActions(
  transitions: { [key: string]: any },
  state: string
) {
  const entry = transitions[state];
  return entry ? Object.keys(entry) : [];
}
