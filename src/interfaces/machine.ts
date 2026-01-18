/**
 * Core machine interfaces for static analysis and runtime inspection
 * 
 * These interfaces provide the abstraction layer that separates static structure
 * analysis from runtime state inspection, enabling different machine types
 * to implement the same contracts.
 */

import type { KeyedStateFactory } from '../state-keyed';

/**
 * Interface for static machine structure analysis
 * 
 * Provides access to the static definition of a machine without requiring
 * runtime instantiation. Used by shape builders and static analysis tools.
 */
export interface MachineDescriptor {
  /** Map of all state definitions keyed by state path */
  readonly states: Map<string, KeyedStateFactory>;
  
  /** Map of all transition definitions keyed by transition ID */
  readonly transitions: Map<string, any>;
  
  /** Map defining the hierarchical relationship between states */
  readonly hierarchy: Map<string, string>;
  
  /** The initial state path of the machine */
  readonly initial: string;
  
  /** Optional initial key for nested machines */
  readonly initialKey?: string;
  
  /** Type of machine (flattened or nested) */
  readonly type?: "flattened" | "nested";
}

/**
 * Type guard to check if an object implements MachineDescriptor
 */
export function isMachineDescriptor(obj: unknown): obj is MachineDescriptor {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'states' in obj &&
    'transitions' in obj &&
    'hierarchy' in obj &&
    'initial' in obj &&
    obj.states instanceof Map &&
    obj.transitions instanceof Map &&
    obj.hierarchy instanceof Map &&
    typeof obj.initial === 'string'
  );
}

/**
 * Convert FactoryMachine to MachineDescriptor
 * Adapter function for backward compatibility
 */
export function createDescriptorFromMachine(machine: any): MachineDescriptor {
  const transitions = machine.transitions || {};
  const states = machine.states || {};
  
  // Build hierarchy from state keys (for flattened machines)
  const hierarchy = new Map<string, string>();
  for (const stateKey of Object.keys(transitions)) {
    const parts = stateKey.split(".");
    const parentKey = parts.length > 1 ? parts.slice(0, -1).join(".") : undefined;
    hierarchy.set(stateKey, parentKey || "");
  }
  
  // Convert transitions to Map
  const transitionMap = new Map<string, any>();
  for (const [stateKey, stateTransitions] of Object.entries(transitions)) {
    transitionMap.set(stateKey, stateTransitions);
  }
  
  // Convert states to Map
  const statesMap = new Map<string, any>();
  for (const [stateKey, stateFactory] of Object.entries(states)) {
    statesMap.set(stateKey, stateFactory);
  }
  
  const machineWithInitial = machine as { initialKey?: string };
  const initialKey = machineWithInitial.initialKey;
  
  return {
    states: statesMap,
    transitions: transitionMap,
    hierarchy,
    initial: initialKey || Object.keys(transitions)[0] || "",
    initialKey,
    type: "flattened"
  };
}
