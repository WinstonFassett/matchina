/**
 * Parent transition fallback for flattened machines
 * 
 * Provides a hook that allows flattened machines to fall back to parent transitions
 * when a transition is not found in the current child state.
 */

export interface ParentTransitionFallbackOptions {
  delimiter?: string;
}

export function withParentTransitionFallback(
  machine: any,
  options: ParentTransitionFallbackOptions = {}
) {
  const { delimiter = '.' } = options;
  
  // Override send to try parent transitions when child transitions are missing
  machine.send((originalSend: any) => {
    return (event: any, ...args: any[]) => {
      const currentState = machine.getState();
      const currentKey = currentState?.key;
      
      if (!currentKey || !currentKey.includes(delimiter)) {
        return originalSend(event, ...args);
      }
      
      const currentTransitions = machine.transitions[currentKey];
      if (currentTransitions && currentTransitions[event]) {
        return originalSend(event, ...args);
      }
      
      // Try parent transitions
      const parts = currentKey.split(delimiter);
      while (parts.length > 1) {
        parts.pop();
        const parentKey = parts.join(delimiter);
        const parentTransitions = machine.transitions[parentKey];
        
        if (parentTransitions && parentTransitions[event]) {
          const target = parentTransitions[event];
          if (typeof target === 'string') {
            const transitionEvent = { type: event, params: args };
            const change = machine.transition(currentState, transitionEvent);
            if (change && change.to !== currentState) {
              machine.update(change);
              return;
            }
          }
        }
      }
      
      return originalSend(event, ...args);
    };
  });
  
  return machine;
}
