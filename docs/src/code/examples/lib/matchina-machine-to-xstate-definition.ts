import type { FactoryMachine, StateMatchboxFactory } from "matchina";
import { resolveState } from "./state-utils";

// May be needed for future xstate features
// function getChildMachine(state: any): FactoryMachine<any> | undefined {
//   return state?.data?.machine || state?.machine;
// }

// function isStateFinal(state: any): boolean {
//   return !!state?.data?.final;
// }
export function getXStateDefinition<
  F extends FactoryMachine<{
    states: StateMatchboxFactory<any>;
    transitions: any;
  }>,
>(machine: F, parentKey?: string) {
  // Check if machine has original hierarchical definition (from flattening)
  const originalDef = (machine as any)._originalDef;
  if (originalDef) {
    // For flattened machines, use original definition for structure but flattened transitions
    return buildDefinitionFromFlattened(originalDef, machine, parentKey);
  }
  
  // Fall back to runtime introspection for non-flattened machines
  type StateStack = { key: string; fullKey: string }[];

  function buildDefinition(
    machine: FactoryMachine<any>,
    parentKey: string | undefined,
    stack: StateStack
  ) {
    const initialState = machine.getState();
    const declaredInitial = (machine as any).initialKey ?? initialState.key;
    const definition = {
      initial: declaredInitial,
      states: {} as Record<string, any>,
    };

    Object.entries(machine.states).forEach(([key, _state]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      // console.log('state', key, {fullKey, parentKey});
      definition.states[key] = { key, fullKey, on: {} };
    });

    Object.entries(machine.transitions).forEach(([fromKey, events]) => {
      Object.entries(events as object).forEach(([event, entry]) => {
        // Skip function transitions - they can't be statically resolved
        if (typeof entry === 'function') {
          return;
        }
        const resolved = resolveState(machine.states, fromKey, entry);
        definition.states[fromKey].on[event] = resolved.key;
      });
    });

    // Auto-discover nested machines from state factories with .machineFactory (from submachine helper)
    Object.entries(machine.states).forEach(([stateKey, stateFactory]) => {
      const machineFactory = (stateFactory as any)?.machineFactory;
      console.log(`[getXStateDefinition] ${stateKey}: machineFactory=${!!machineFactory}, def=${!!machineFactory?.def}`);
      if (!machineFactory?.def) {
        return;  // Must have .def - no function calls!
      }

      try {
        // Get definition from factory - this is the schema, no instantiation needed
        const nestedDef = machineFactory.def;

        // For building xstate definition, we need a machine-like object
        // Create a pseudo-machine from the definition
        const nestedMachine = {
          states: nestedDef.states,
          transitions: nestedDef.transitions,
          initialKey: nestedDef.initial,
          getState: () => ({ key: nestedDef.initial })  // Minimal stub for compatibility
        };
        // Override buildDefinition to skip function transitions for nested machines
        const buildNestedDefinition = (machine: any, parentKey: string | undefined, stack: any) => {
          const initialState = machine.getState();
          const declaredInitial = (machine as any).initialKey ?? initialState.key;
          const definition = {
            initial: declaredInitial,
            states: {} as Record<string, any>,
          };

          Object.entries(machine.states).forEach(([key, _state]) => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            definition.states[key] = { key, fullKey, on: {} };
          });

          Object.entries(machine.transitions).forEach(([fromKey, events]) => {
            Object.entries(events as object).forEach(([event, entry]) => {
              // Skip function transitions - they can't be statically resolved
              if (typeof entry === 'function') {
                return;
              }
              const resolved = resolveState(machine.states, fromKey, entry);
              definition.states[fromKey].on[event] = resolved.key;
            });
          });

          return definition;
        };

        if (nestedMachine && nestedDef.states) {
          const childFullKey = parentKey ? `${parentKey}.${stateKey}` : stateKey;
          const childStack = [...stack, { key: stateKey, fullKey: childFullKey }];
          const childDefinition = buildNestedDefinition(nestedMachine as any, childFullKey, childStack);

          if (!definition.states[stateKey]) {
            definition.states[stateKey] = { on: {} };
          }
          if (nestedMachine.initialKey !== undefined) {
            definition.states[stateKey].initial = nestedMachine.initialKey;
          }
          definition.states[stateKey].states = childDefinition.states;
          definition.states[stateKey].stack = childStack;

          // Copy parent transitions to nested states for visualization
          // This shows what events are available at the parent level
          const parentTransitions = machine.transitions?.[stateKey] || {};
          for (const [nestedKey, nestedConfig] of Object.entries(childDefinition.states) as [string, any][]) {
            for (const [event, target] of Object.entries(parentTransitions)) {
              // Only add string transitions that aren't already defined
              if (typeof target === 'string' && !nestedConfig.on[event]) {
                nestedConfig.on[event] = target;
              }
            }
          }
        }
      } catch (e) {
        // Skip if nested machine inspection fails
      }
    });

    // Fallback: check current state for nested machine (backward compatibility for non-submachine usage)
    try {
      const currentState = initialState;
      const currentKey = currentState?.key;

      // Only process if not already handled by submachine auto-discovery
      if (currentState?.data?.machine && !definition.states[currentKey]?.states) {
        const childMachine = currentState.data.machine;
        if (childMachine && typeof childMachine.getState === "function") {
          const childFullKey = parentKey ? `${parentKey}.${currentKey}` : currentKey;
          const childStack = [...stack, { key: currentKey, fullKey: childFullKey }];
          const childDefinition = buildDefinition(childMachine, childFullKey, childStack);

          if (!definition.states[currentKey]) {
            definition.states[currentKey] = { on: {} };
          }
          if (childMachine.initialKey !== undefined) {
            definition.states[currentKey].initial = childMachine.initialKey;
          }
          definition.states[currentKey].states = childDefinition.states;
          definition.states[currentKey].stack = childStack;
        }
      }
    } catch (e) {
      // Don't break if nested machine inspection fails
    }

    // Attach stack to top-level states
    Object.values(definition.states).forEach((state: any) => {
      if (!state.stack) {
        state.stack = [...stack, { key: state.key, fullKey: state.fullKey }];
      }
    });
    // console.log('definition', definition);
    return definition;
  }

  return buildDefinition(machine, parentKey, []);
}

/**
 * Build XState definition from preserved original hierarchical definition.
 * Used when a flattened machine has _originalDef attached.
 */
function buildDefinitionFromOriginal(def: any, parentKey?: string) {
  type StateStack = { key: string; fullKey: string }[];
  
  function buildFromDef(
    states: any,
    transitions: any,
    initial: string,
    parentKey: string | undefined,
    stack: StateStack
  ): any {
    const definition = {
      initial,
      states: {} as Record<string, any>,
    };

    // Process each state
    for (const [key, stateFactory] of Object.entries(states)) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      definition.states[key] = { key, fullKey, on: {} };
      
      // Check if this state has a nested machine (from defineSubmachine)
      let nestedMachine: any = null;
      try {
        // Try to get the state value to check for nested machine
        if (typeof stateFactory === 'function') {
          const stateValue = (stateFactory as any)();
          // defineSubmachine returns { machine: MachineDefinition }
          // The machine definition has { states, transitions, initial }
          const machineRef = stateValue?.machine || stateValue?.data?.machine;
          if (machineRef && machineRef.states && machineRef.transitions) {
            nestedMachine = machineRef;
          }
        }
      } catch (e) {
        // Ignore - not a submachine
      }
      
      if (nestedMachine) {
        // Recursively build nested definition
        const childStack = [...stack, { key, fullKey }];
        const childDef = buildFromDef(
          nestedMachine.states,
          nestedMachine.transitions,
          nestedMachine.initial,
          fullKey,
          childStack
        );
        definition.states[key].initial = nestedMachine.initial;
        definition.states[key].states = childDef.states;
        definition.states[key].stack = childStack;
      } else {
        definition.states[key].stack = [...stack, { key, fullKey }];
      }
    }

    // Process transitions - need to handle both parent and nested transitions
    for (const [fromKey, events] of Object.entries(transitions || {})) {
      if (!definition.states[fromKey]) continue;
      for (const [event, target] of Object.entries(events as any || {})) {
        if (typeof target === 'string') {
          definition.states[fromKey].on[event] = target;
        }
      }
    }
    
    // Also add transitions from nested states to their parent's on map
    // This ensures parent-level transitions show up in the visualization
    for (const [stateKey, stateConfig] of Object.entries(definition.states) as [string, any][]) {
      if (stateConfig.states) {
        // Copy parent transitions to nested states (they apply to all children)
        const parentTransitions = transitions?.[stateKey] || {};
        for (const [nestedKey, nestedConfig] of Object.entries(stateConfig.states) as [string, any][]) {
          for (const [event, target] of Object.entries(parentTransitions)) {
            if (typeof target === 'string' && !nestedConfig.on[event]) {
              nestedConfig.on[event] = target;
            }
          }
        }
      }
    }

    return definition;
  }

  return buildFromDef(def.states, def.transitions, def.initial, parentKey, []);
}

/**
 * Build XState definition for flattened machines using original structure
 * but with actual flattened transitions from the machine.
 */
function buildDefinitionFromFlattened(originalDef: any, flattenedMachine: any, parentKey?: string) {
  // Get the flattened transitions from the actual machine
  const flattenedTransitions = flattenedMachine.transitions;
  
  // Build the hierarchical structure from original definition
  const hierarchicalDef = buildDefinitionFromOriginal(originalDef, parentKey);
  
  // Replace transitions with flattened ones
  function updateTransitions(states: any, transitions: any, prefix = '') {
    for (const [stateKey, stateConfig] of Object.entries(states) as [string, any][]) {
      const fullKey = prefix ? `${prefix}.${stateKey}` : stateKey;
      
      // Use flattened transitions if they exist, otherwise keep original
      // Check both the full key (Active.TextEntry) and just the state key (TextEntry)
      const flattenedTransitions = transitions[fullKey] || transitions[stateKey];
      if (flattenedTransitions) {
        stateConfig.on = {};
        for (const [event, target] of Object.entries(flattenedTransitions as any || {})) {
          if (typeof target === 'string') {
            stateConfig.on[event] = target;
          }
        }
      }
      
      // Recursively update nested states
      if (stateConfig.states) {
        updateTransitions(stateConfig.states, transitions, fullKey);
      }
    }
  }
  
  updateTransitions(hierarchicalDef.states, flattenedTransitions);
  return hierarchicalDef;
}
