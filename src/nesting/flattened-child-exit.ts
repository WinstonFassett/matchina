/**
 * Child.exit behavior for flattened machines
 * 
 * Provides send-hook-based instrumentation to automatically trigger child.exit
 * when flattened machines reach final child states, matching nested machine behavior.
 */

import { send } from '../state-machine-hooks';
import { setup } from '../ext/setup';

export interface FlattenedChildExitOptions {
  delimiter?: string;
}

export function withFlattenedChildExit(
  machine: any,
  options: FlattenedChildExitOptions = {}
) {
  const { delimiter = '.' } = options;
  
  // Use proper hook setup with send hook to avoid interfering with machine state
  setup(machine)(
    send((originalSend: any) => {
      return (type: any, ...args: any[]) => {
        // Execute the original send first
        const result = originalSend(type, ...args);
        
        // Check if we just transitioned to a final child state
        const currentState = machine.getState();
        if (currentState && currentState.key && currentState.key.includes(delimiter)) {
          const isFinal = isChildFinal(machine, currentState);
          
          if (isFinal && type !== 'child.exit') {
            // Trigger child.exit event on the next tick to avoid recursion
            setTimeout(() => {
              machine.send('child.exit');
            }, 0);
          }
        }
        
        return result;
      };
    })
  );
  
  return machine;
}

function isChildFinal(machine: any, state: any): boolean {
  // Check if state data has final flag
  if (state?.data?.final) {
    return true;
  }
  
  // Check if state has no outgoing transitions
  const transitions = machine.transitions[state.key];
  if (!transitions || Object.keys(transitions).length === 0) {
    return true;
  }
  
  // Check if this is a leaf state (no further child states)
  const delimiter = '.';
  if (state.key.includes(delimiter)) {
    const parentKey = state.key.substring(0, state.key.lastIndexOf(delimiter));
    
    // Look for any child states of the same parent
    const childStates = Object.keys(machine.transitions).filter(key => 
      key.startsWith(parentKey + delimiter) && key !== state.key
    );
    
    // If there are no other child states, this might be a final child
    // But we need to check if there are transitions that don't go to other child states
    const hasNonChildTransitions = Object.values(transitions).some(target => {
      if (typeof target === 'string') {
        return !target.startsWith(parentKey + delimiter);
      }
      return false;
    });
    
    // If all transitions go to other child states or are special transitions, consider it final
    if (!hasNonChildTransitions && childStates.length === 0) {
      return true;
    }
  }
  
  return false;
}
