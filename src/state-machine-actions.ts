import { TransitionRecord } from "./transition-machine";


export function getAvailableActions(
  transitions: TransitionRecord,
  state: string
) {
  const entry = transitions[state];
  return entry ? Object.keys(entry) : [];
}
