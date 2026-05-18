import type { FactoryMachine } from "../../factory-machine-types";
import type { FactoryMachineApi } from "../../factory-machine-api-types";
import { createLazyShapeStore } from "../../shape";
import { AllEventsOf } from "../utility-types";

// Enhanced machine interfaces for better type safety

export type HierarchicalMachine<
  M extends FactoryMachine<any> = FactoryMachine<any>
> = Omit<M, 'send'> & {
  shape: ReturnType<typeof createLazyShapeStore>;

  /**
   * Send an event to the hierarchical machine.
   * Accepts parent/child machine event types plus `child.*` namespaced events.
   */
  send(type: string, ...params: any[]): void;
};

// Type representing all events in a hierarchical machine (including child.* events)

export type HierarchicalEvents<M extends FactoryMachine<any>> = 
  | AllEventsOf<M>
  | { type: "child.change"; target: any; eventType: string; params: any[]; _internal?: boolean }
  | { type: "child.exit"; target: any; eventType: string; params: any[]; _internal?: boolean }
  | { type: `child.${string}`; params: any[] };

export interface DuckTypedMachine {
  getState(): any;
  send(type: string, ...params: any[]): any;
}
export interface OptionalDuckTypedMachine {
  getState(): any;
  send?(type: string, ...params: any[]): any;
}
export interface PropagatedMachine extends DuckTypedMachine {
  __propagateUnhook?: () => void;
  hierarchical?: boolean;
  transitions?: Record<string, Record<string, any>>;
  resolveExit?: (event: any) => any;
  transition?: (event: any) => void;
}
interface ChildChangePayload {
  target?: FactoryMachine<any>;
  type: string;
  params?: any[];
  _internal?: boolean;
}
interface InternalChildChangePayload extends ChildChangePayload {
  _internal: true;
}
// Enhanced root machine interface
export interface RootMachine {
  send: (type: string, ...params: any[]) => void;
  transition?: (event: any) => void;
  notify?: (event: any) => void;
  resolveExit?: (event: any) => any;
  getState(): any;
}

/**
 * Creates an HSM-aware event API that works with HierarchicalMachine
 * Recursively gathers transitions from all nested machines in the hierarchy
 */
export function hsmEventApi<M extends FactoryMachine<any>>(
  machine: M,
  hsm: HierarchicalMachine<M>
): FactoryMachineApi<M> {
  const events: any = {};
  
  // Helper function to recursively collect transitions
  function collectTransitions(currentMachine: any, visited = new Set()) {
    if (visited.has(currentMachine)) return;
    visited.add(currentMachine);
    
    const { states, transitions } = currentMachine;
    if (!states || !transitions) return;
    
    for (const stateKey in states) {
      const transitionKey = stateKey as keyof typeof transitions;
      const stateTransitions = transitions[transitionKey];
      if (stateTransitions) {
        for (const eventKey in stateTransitions) {
          if (!events[eventKey]) {
            events[eventKey] = (...params: any[]) => {
              return (hsm as any).send(eventKey, ...params);
            };
          }
        }
      }
      
      // Recursively collect from nested machines
      const stateFactory = states[stateKey];
      if (stateFactory && typeof stateFactory === 'function') {
        const stateInstance = stateFactory();
        if (stateInstance.machine) {
          collectTransitions(stateInstance.machine, visited);
        }
      }
    }
  }
  
  collectTransitions(machine);
  return events;
}
