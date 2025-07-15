import type { AnyStatesFactory, FactoryState } from "@lib/src";
import type { TransitionEntry } from "./utility-types";


export function getStateValues<S extends AnyStatesFactory>(states: S) {
  return Object.entries(states).map(([, value]) => value({}));
}
// function resolveExitState(states: AnyStatesFactory, to: any): any {
//   return typeof to === 'string' ? resolveState(states, to) :
// }

export function resolveState<S extends AnyStatesFactory>(
  states: AnyStatesFactory,
  entry: TransitionEntry<any>
): FactoryState<S> {
  if (typeof entry === "string") {
    return states[entry]({} as any); // as FactoryState<S>
  }
  if (typeof entry === "function") {
    let funcOrState = entry();
    if (typeof funcOrState === "function") {
      funcOrState = funcOrState();
    }
    return resolveState(states, funcOrState);
  }
  return entry as any;
}
