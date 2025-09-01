/**
 * Enhanced transition types and resolution that support inspectable transitions.
 * 
 * This enables the { to: key, handle: fn } format for better debugging and visualization.
 */

import { FactoryMachineContext, FactoryMachineEvent } from "./factory-machine-types";
import { ResolveEvent } from "./state-machine-types";
import { resolveExitState as originalResolveExitState } from "./factory-machine";

// Enhanced transition format
export interface InspectableTransition<States> {
  to: keyof States;
  handle?: (...params: any[]) => any;
}

// Union type supporting both old and new formats
export type EnhancedTransition<States> = 
  | string // legacy: direct state key
  | ((...params: any[]) => any) // legacy: transition function  
  | InspectableTransition<States>; // new: inspectable format

/**
 * Type guard to check if a transition is in the inspectable format
 */
export function isInspectableTransition<States>(
  transition: EnhancedTransition<States>
): transition is InspectableTransition<States> {
  return (
    typeof transition === "object" &&
    transition !== null &&
    "to" in transition &&
    typeof (transition as any).to === "string"
  );
}

/**
 * Enhanced transition resolution that supports the { to, handle } format
 * while maintaining backward compatibility with existing formats.
 */
export function resolveExitStateEnhanced<FC extends FactoryMachineContext<any>>(
  transition: EnhancedTransition<FC["states"]> | undefined,
  ev: ResolveEvent<FactoryMachineEvent<FC>>,
  states: FC["states"]
) {
  if (!transition) {
    return undefined;
  }

  // Handle inspectable transition format: { to: key, handle: fn }
  if (isInspectableTransition(transition)) {
    const { to, handle } = transition;
    
    // If there's a handler, call it to get any dynamic parameters
    if (handle) {
      const result = handle(...ev.params);
      
      // Handler can return:
      // 1. A state instance directly
      // 2. Parameters to pass to the target state factory
      // 3. undefined (use default parameters)
      if (result && typeof result === "object" && "key" in result) {
        // Handler returned a state instance directly
        return result;
      } else if (Array.isArray(result)) {
        // Handler returned parameters for state factory
        return states[to as keyof typeof states](...result) as any;
      } else if (result !== undefined) {
        // Handler returned a single parameter
        return states[to as keyof typeof states](result) as any;
      }
    }
    
    // No handler or handler returned undefined, use event params
    return states[to as keyof typeof states](...ev.params) as any;
  }

  // Fall back to original resolution for backward compatibility
  return originalResolveExitState(transition as any, ev, states);
}

/**
 * Extract target state keys from transitions for static analysis.
 * This is useful for visualization and debugging.
 */
export function getTransitionTargets<States>(
  transitions: Record<string, Record<string, EnhancedTransition<States>>>
): Record<string, Record<string, keyof States>> {
  const targets: Record<string, Record<string, keyof States>> = {};
  
  for (const [fromState, stateTransitions] of Object.entries(transitions)) {
    targets[fromState] = {};
    
    for (const [event, transition] of Object.entries(stateTransitions)) {
      if (typeof transition === "string") {
        targets[fromState][event] = transition as keyof States;
      } else if (isInspectableTransition(transition)) {
        targets[fromState][event] = transition.to;
      } else {
        // Function transitions - cannot determine target statically
        targets[fromState][event] = "?" as keyof States;
      }
    }
  }
  
  return targets;
}

/**
 * Create an inspectable transition
 * @param to - Target state key
 * @param handle - Optional handler function
 * @returns Inspectable transition object
 */
export function createTransition<States>(
  to: keyof States,
  handle?: (...params: any[]) => any
): InspectableTransition<States> {
  return handle ? { to, handle } : { to };
}

/**
 * Enhanced version of resolveNextState that supports inspectable transitions
 */
export function resolveNextStateEnhanced<FC extends FactoryMachineContext<any>>(
  transitions: Record<string, Record<string, EnhancedTransition<FC["states"]>>>,
  states: FC["states"],
  ev: ResolveEvent<FactoryMachineEvent<FC>>
) {
  const transition = transitions[ev.from.key]?.[ev.type];
  return resolveExitStateEnhanced(transition, ev, states);
}

// Re-export for convenience
export { resolveExitState } from "./factory-machine";