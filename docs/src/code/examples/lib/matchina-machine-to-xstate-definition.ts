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
        const resolved = resolveState(machine.states, fromKey, entry);
        definition.states[fromKey].on[event] = resolved.key;
      });
    });

    // Auto-discover nested machines from state factories with .machineFactory (from submachine helper)
    Object.entries(machine.states).forEach(([stateKey, stateFactory]) => {
      const machineFactory = (stateFactory as any)?.machineFactory;
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

        if (nestedMachine && nestedDef.states) {
          const childFullKey = parentKey ? `${parentKey}.${stateKey}` : stateKey;
          const childStack = [...stack, { key: stateKey, fullKey: childFullKey }];
          const childDefinition = buildDefinition(nestedMachine as any, childFullKey, childStack);

          if (!definition.states[stateKey]) {
            definition.states[stateKey] = { on: {} };
          }
          if (nestedMachine.initialKey !== undefined) {
            definition.states[stateKey].initial = nestedMachine.initialKey;
          }
          definition.states[stateKey].states = childDefinition.states;
          definition.states[stateKey].stack = childStack;
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
