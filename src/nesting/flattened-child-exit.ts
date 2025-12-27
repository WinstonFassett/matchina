/**
 * Child.exit behavior for flattened machines
 */

import { transition } from "../state-machine-hooks";

export interface FlattenedChildExitOptions {
  delimiter?: string;
}

export function withFlattenedChildExit(
  machine: any,
  options: FlattenedChildExitOptions = {}
) {
  const { delimiter = "." } = options;
  
  machine.transition((originalTransition: any) => {
    return (event: any) => {
      const result = originalTransition(event);
      
      if (result && event.type !== "__initialize" && result.to?.key) {
        const currentKey = result.to.key;
        
        if (currentKey.includes(delimiter)) {
          const isFinal = isChildFinal(machine, result.to);
          
          if (isFinal) {
            setTimeout(() => {
              machine.send("child.exit");
            }, 0);
          }
        }
      }
      
      return result;
    };
  });
  
  return machine;
}

function isChildFinal(machine: any, state: any): boolean {
  if (state?.data?.final) {
    return true;
  }
  
  const transitions = machine.transitions[state.key];
  if (!transitions || Object.keys(transitions).length === 0) {
    return true;
  }
  
  return false;
}
