/**
 * Parent transition fallback for flattened machines
 * 
 * Provides a hook that allows flattened machines to fall back to parent transitions
 * when a transition is not found in the current child state.
 */

import { resolveExit } from '../state-machine-hooks';
import { setup } from '../ext/setup';
import { FactoryMachineEventImpl } from '../factory-machine-event';

export interface ParentTransitionFallbackOptions {
  delimiter?: string;
}

export function withParentTransitionFallback(
  machine: any,
  options: ParentTransitionFallbackOptions = {}
) {
  const { delimiter = '.' } = options;
  
  // Use resolveExit hook to intercept exit resolution
  setup(machine)(
    resolveExit((ev: any, next: any) => {
      const currentKey = ev.from?.key;
      
      // First try the normal resolution (child state transitions)
      const resolved = next(ev);
      if (resolved) {
        return resolved;
      }
      
      // If not a hierarchical state, stop here
      if (!currentKey || !currentKey.includes(delimiter)) {
        return undefined;
      }
      
      // Try to resolve from parent transitions
      const parts = currentKey.split(delimiter);
      while (parts.length > 1) {
        parts.pop();
        const parentKey = parts.join(delimiter);
        const parentTransitions = machine.transitions[parentKey];
        
        if (parentTransitions && parentTransitions[ev.type]) {
          // Found a parent transition, resolve it manually
          const target = parentTransitions[ev.type];
          if (typeof target === 'string') {
            // Create a new event with the resolved state
            const targetState = machine.states[target]?.(...ev.params);
            if (targetState) {
              return new FactoryMachineEventImpl(
                ev.type,
                ev.from,
                targetState,
                ev.params
              );
            }
          } else if (typeof target === 'function') {
            // Handle function-based transitions
            const stateOrFn = target(...ev.params);
            const targetState = typeof stateOrFn === 'function' ? stateOrFn(ev) : stateOrFn;
            if (targetState) {
              return new FactoryMachineEventImpl(
                ev.type,
                ev.from,
                targetState,
                ev.params
              );
            }
          }
          return undefined;
        }
      }
      
      return undefined;
    })
  );
  
  return machine;
}
